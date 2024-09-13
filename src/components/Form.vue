<!--
 * @Version    : v1.00
 * @Author     : itchaox
 * @Date       : 2023-12-23 09:34
 * @LastAuthor : itchaox
 * @LastTime   : 2024-03-27 22:42
 * @desc       : 
-->

<script setup lang="ts">
  import { bitable } from '@lark-base-open/js-sdk';
  import { Close, CaretRight, InfoFilled } from '@element-plus/icons-vue';
  import FieldIcon from './fieldIcon.jsx';
  import { dayjs } from 'element-plus';

  import { useI18n } from 'vue-i18n';

  import QrcodeVue, { Level, RenderAs } from 'qrcode.vue';

  const { t } = useI18n();

  import { BrowserSafari, PreviewOpen, PreviewClose, DocDetail, CopyLink, EmotionHappy } from '@icon-park/vue-next';

  const rawUrl = ref('');

  import useClipboard from 'vue-clipboard3';

  // FIXME 筛选
  const groupList = ref([]);

  const addFilter = async () => {
    const idsInGroup = groupList.value.map((item) => item.id);
    const _list = groupFieldList.value.filter((item) => !idsInGroup.includes(item.id));

    if (_list?.[0]) {
      let { id, name, type } = _list?.[0];
      let options = [];

      if (_list[0]?.type === 3 || _list[0]?.type === 4) {
        // 单选/多选
        const selectField = await table.getField(id);
        options = await selectField.getOptions();
      }

      if (_list[0]?.type === 7) {
        groupList.value.push({
          name,
          type,
          id,
          isShow: true,
          value: '1',
        });
      } else {
        groupList.value.push({
          id,
          name,
          type,
          isShow: true,
          options,
          value: '',
        });
      }
    }
  };

  const filterFiledChange = async (item, index) => {
    let _activeItem = groupFieldList.value.find((i) => i.id === item.id);

    // 新增的选项
    if (!_activeItem) {
      groupList.value[index] = {
        name: item?.id,
        type: 1,
        id: item?.id,
        isShow: true,
        value: '',
      };
      return;
    }

    // 修改
    if (_activeItem?.type === 3 || _activeItem?.type === 4) {
      // 单选/多选
      const selectField = await table.getField(item.id);
      let options = await selectField.getOptions();

      // 更新选项
      groupList.value[index] = {
        options: options || [],
        name: _activeItem.name,
        type: _activeItem.type,
        id: _activeItem.id,
        isShow: true,
        value: '',
      };
    } else if (_activeItem.type === 7) {
      groupList.value[index] = {
        name: _activeItem.name,
        type: _activeItem.type,
        id: _activeItem.id,
        isShow: true,
        value: '1',
      };
    } else {
      groupList.value[index] = {
        name: _activeItem?.name,
        type: _activeItem?.type,
        id: _activeItem?.id,
        isShow: true,
        value: '',
      };
    }
  };

  const formDefaultUrl = ref();

  watchEffect(() => {
    if (!rawUrl.value) {
      formDefaultUrl.value = '';
    }
  });

  /**
   * @desc  : 生成转换后的地址
   */
  function generateFormDefaultUrl() {
    if (!rawUrl.value) {
      ElMessage({
        message: t('Please fill in the form address first'),
        type: 'error',
        duration: 1500,
        showClose: true,
      });
      return;
    }

    // const prefix = 'https://bcmcjimpjd.feishu.cn/share/base/form';

    // if (!rawUrl.value.startsWith(prefix)) {
    //   // rawUrl 不以指定前缀开始
    //   ElMessage({
    //     message: t('f1'),
    //     type: 'error',
    //     duration: 1500,
    //     showClose: true,
    //   });

    //   return;
    // }

    console.log(groupList.value);

    const queryParams = groupList.value
      .map((item) => {
        let processedValue;

        switch (item.type) {
          case 5:
            processedValue = dayjs(item.value).format('YYYY/MM/DD HH:mm');
            break;
          case 3:
            processedValue = item.value.name;
            break;
          case 4:
            processedValue = item.value.map((i) => i.name).join(',');
            break;
          default:
            processedValue = item.value.replace(/，/g, ',');
        }

        let _data;

        // 是否隐藏问题
        if (item.isShow) {
          _data = `prefill_${encodeURIComponent(item.name)}=${encodeURIComponent(processedValue)}`;
        } else {
          _data = `prefill_${encodeURIComponent(item.name)}=${encodeURIComponent(
            processedValue,
          )}&hide_${encodeURIComponent(item.name)}=${encodeURIComponent(1)}`;
        }

        return _data;
      })
      .join('&');

    if (queryParams) {
      formDefaultUrl.value = rawUrl.value + `?${queryParams}`;
    } else {
      formDefaultUrl.value = rawUrl.value;
    }

    ElMessage({
      message: t('Successful generation'),
      type: 'success',
      duration: 1500,
      showClose: true,
    });
  }

  const { toClipboard } = useClipboard();

  async function copy() {
    try {
      // 复制
      await toClipboard(formDefaultUrl.value);
      ElMessage({
        message: t('Copy Success'),
        type: 'success',
        duration: 1500,
        showClose: true,
      });
      // 复制成功
    } catch (e) {
      // 复制失败
    }
  }

  function goUrl() {
    window.open(formDefaultUrl.value, '_blank');
  }

  function more() {
    window.open(
      'https://www.feishu.cn/hc/zh-CN/articles/763023425825-%E8%AE%BE%E7%BD%AE%E8%A1%A8%E5%8D%95%E9%A2%84%E5%A1%AB%E9%BB%98%E8%AE%A4%E5%80%BC',
      '_blank',
    );
  }

  const collapse = ref('0');

  // 筛选的字段列表
  const groupFieldList = ref([]);

  let table;
  let view;

  async function init() {
    table = await bitable.base.getActiveTable();
    view = await table.getActiveView();
    let _fieldList = await view.getFieldMetaList();

    groupFieldList.value = _fieldList.filter((item) =>
      [1, 2, 3, 4, 5, 7, 11, 13, 15, 18, 21, 99001, 99002, 99003].includes(item.type),
    );

    groupFieldList.value = groupFieldList.value.map((item) => ({
      name: item.name,
      id: item.id,
      type: item.type,
      value: '',
    }));
  }

  const selectOptColorInfo = ref();
  onMounted(async () => {
    await init();
    selectOptColorInfo.value = await bitable.ui.getSelectOptionColorInfoList();

    table.onFieldAdd(async (event) => {
      isChange.value = true;
    });

    table.onFieldModify(async (event) => {
      isChange.value = true;
    });

    table.onFieldDelete(async (event) => {
      isChange.value = true;
    });
  });

  const isChange = ref(false);

  async function confirmRefresh() {
    groupList.value = [];
    let _fieldList = await view.getFieldMetaList();

    groupFieldList.value = _fieldList.filter((item) =>
      [1, 2, 3, 4, 5, 7, 11, 13, 15, 18, 21, 99001, 99002, 99003].includes(item.type),
    );

    groupFieldList.value = groupFieldList.value.map((item) => ({
      name: item.name,
      id: item.id,
      type: item.type,
      value: '',
    }));

    ElMessage.success(t('Refresh Successful'));
    isChange.value = false;
  }

  const level = ref<Level>('M');
  const renderAs = ref<RenderAs>('canvas');

  function downloadQr() {
    const link = document.createElement('a');
    link.download = t('Form default value address QR code');
    link.href = (document.getElementById('qr-code') as HTMLCanvasElement).toDataURL();
    link.click();
  }

  const dialogTableVisible = ref(false);
</script>

<template>
  <div class="home">
    <el-collapse
      v-model="collapse"
      class="collapse"
    >
      <!-- FIXME 筛选 -->
      <el-collapse-item name="1">
        <template #title>
          <el-icon class="mr5"><InfoFilled /></el-icon>
          <span class="collapse-title">{{ $t('More operational information') }}</span>
        </template>
        <div
          class="tip"
          style="margin-bottom: 0"
        >
          <div
            class="tip-text"
            style="margin-bottom: 0"
          >
            {{ $t('2') }}
          </div>
          <div
            class="tip-text"
            style="margin-bottom: 0"
          >
            {{ $t('4') }}
          </div>

          <div
            class="tip-text"
            style="margin-bottom: 0"
          >
            {{ $t('41') }}
          </div>

          <div
            class="tip-text"
            style="margin-bottom: 0"
          >
            {{ $t('51') }}
          </div>

          <div
            @click="more"
            class="more"
          >
            <div>
              <DocDetail
                theme="outline"
                size="13"
              />
            </div>
            <span>{{ $t('Check out the official documentation for an introduction') }}</span>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>

    <template v-if="isChange">
      <div class="tip-error">
        <el-icon size="16"><Warning /></el-icon>
        <span>{{ $t('note') }}</span>
      </div>

      <el-popconfirm
        width="60vw"
        :confirm-button-text="$t('Confirm')"
        :cancel-button-text="$t('Cancel')"
        @confirm="confirmRefresh"
        :icon="InfoFilled"
        icon-color="rgb(20, 86, 240)"
        cancel-button-type="info"
        :hide-after="50"
        :title="$t('tttt')"
      >
        <template #reference>
          <el-button
            type="primary"
            class="refresh"
          >
            <el-icon size="16"><Refresh /></el-icon>
            <span>{{ $t('refresh') }}</span>
          </el-button>
        </template>
      </el-popconfirm>
    </template>

    <div class="addView-line">
      <div class="addView-line-label">{{ $t('Form address') }}</div>
      <el-input
        style="width: 75%"
        v-model="rawUrl"
        :title="rawUrl"
        clearable
        :placeholder="$t('Please enter the form address')"
      />
    </div>

    <div>
      <div class="collapse-line-list">
        <div
          class="collapse-line"
          v-for="(item, index) in groupList"
          :key="item.id"
        >
          <div
            class="collapse-line-value line1"
            style="width: 50%"
          >
            <!-- <el-input
              v-if="item.isOtherFiled"
              v-model="item.name"
              :title="item.name"
              clearable
              :placeholder="$t('Please enter the name of the question')"
            /> -->

            <el-select
              allow-create
              default-first-option
              style="width: 100%"
              filterable
              v-model="item.id"
              :title="item.name"
              @change="filterFiledChange(item, index)"
            >
              <el-option
                v-for="field in groupFieldList"
                :key="field.id"
                :label="field.name"
                :title="field.name"
                :value="field.id"
                :disabled="groupList.map((j) => j.id).includes(field.id)"
              >
                <field-icon :fieldType="field.type" />
                <span>
                  {{ field.name }}
                </span>
              </el-option>
            </el-select>
            <!-- 
            <el-icon
              class="edit"
              size="20"
              @click="
                () => {
                  item.isOtherFiled = true;
                  item.name = '';
                }
              "
              ><Edit
            /></el-icon> -->
          </div>

          <!-- 值 -->
          <div
            class="collapse-line-value"
            style="width: 50%"
          >
            <!-- FIXME 输入框 -->
            <el-input
              v-if="[1, 2, 11, 99003, 99002, 99001, 13, 15, 18, 21].includes(item.type)"
              v-model="item.value"
              :title="item.value"
              :placeholder="$t('Please enter', [item.name])"
              clearable
            />

            <!-- FIXME 单选 -->
            <el-select
              filterable
              style="width: 100%"
              v-else-if="item.type === 3"
              v-model="item.value"
              value-key="id"
              :title="item?.options?.find((i) => i.id === item.value)?.name"
              :placeholder="$t('Please select', [item.name])"
            >
              <el-option
                v-for="j in item.options"
                :key="j.id"
                :label="j.name"
                :value="j"
              >
                <span
                  class="option-class"
                  :style="{
                    'background-color': selectOptColorInfo.find((x) => x.id === j.color)?.bgColor,
                    color: selectOptColorInfo.find((y) => y.id === j.color)?.textColor,
                  }"
                >
                  {{ j.name }}
                </span>
              </el-option>
            </el-select>

            <!-- FIXME 多选 -->
            <el-select
              filterable
              style="width: 100%"
              v-if="item.type === 4"
              value-key="id"
              multiple
              collapse-tags
              collapse-tags-tooltip
              v-model="item.value"
              :title="item?.options?.find((i) => i.id === item.value)?.name"
              :placeholder="$t('Please select', [item.name])"
            >
              <el-option
                v-for="j in item.options"
                :key="j.id"
                :label="j.name"
                :value="j"
              >
                <span
                  class="option-class"
                  :style="{
                    'background-color': selectOptColorInfo.find((x) => x.id === j.color)?.bgColor,
                    color: selectOptColorInfo.find((y) => y.id === j.color)?.textColor,
                  }"
                >
                  {{ j.name }}
                </span>
              </el-option>
            </el-select>

            <el-date-picker
              v-else-if="item.type === 5"
              style="width: 100%"
              v-model="item.value"
              type="datetime"
              :placeholder="$t('Please select a date')"
              format="YYYY/MM/DD HH:mm"
            />

            <el-select
              style="width: 100%"
              v-else-if="item.type === 7"
              v-model="item.value"
              :title="item.name"
              :placeholder="$t('Please select', [item.name])"
            >
              <el-option
                :label="$t('tick')"
                value="1"
              >
                {{ $t('tick') }}
              </el-option>

              <el-option
                :label="$t('unchecked')"
                value="0"
              >
                {{ $t('unchecked') }}
              </el-option>
            </el-select>
            <!-- suffix-icon="x" -->
          </div>
          <div class="show">
            <template v-if="item.isShow">
              <preview-open
                @click="() => (item.isShow = !item?.isShow)"
                class="option-btn"
                theme="outline"
                size="24"
                fill="#333"
                strokeLinecap="square"
              />
              <div style="color: #333">{{ $t('show') }}</div>
            </template>

            <template v-else>
              <preview-close
                @click="() => (item.isShow = !item?.isShow)"
                class="option-btn"
                theme="outline"
                size="24"
                fill="#bbbfc4"
                strokeLinecap="square"
              />

              <div style="color: #bbbfc4">{{ $t('hide') }}</div>
            </template>
          </div>

          <el-button
            :icon="Close"
            class="collapse-delete"
            @click="() => groupList.splice(index, 1)"
            text
          />
        </div>
      </div>
      <el-button
        v-if="groupFieldList.length > groupList.length"
        class="add"
        text
        @click="addFilter"
      >
        <el-icon class="add-icon"><Plus /></el-icon>{{ $t('Adding default values') }}
      </el-button>
    </div>

    <div class="default-url">
      <el-button
        type="primary"
        @click="generateFormDefaultUrl"
      >
        <el-icon size="20"><CaretRight /></el-icon>
        <span>{{ $t('Generate default value address') }}</span>
      </el-button>
      <div
        class="default-url-text"
        v-if="formDefaultUrl"
      >
        <div class="url-label">
          <div
            class="url-icon url-icon-preview"
            @click="goUrl"
          >
            <BrowserSafari
              size="16"
              theme="outline"
              strokeLinejoin="miter"
              strokeLinecap="butt"
            />
            <span>{{ $t('Click to preview') }}</span>
          </div>
          <div
            class="url-icon"
            @click="copy"
          >
            <CopyLink
              theme="outline"
              size="16"
            />
            <span>{{ $t('Click to copy the address') }}</span>
          </div>
        </div>

        <div class="qr-code-class">
          <div class="qr-code-text">{{ $t('Scan code preview') }}</div>
          <qrcode-vue
            id="qr-code"
            class="qr-code-img"
            :value="formDefaultUrl"
            :level="level"
            :size="150"
            :render-as="renderAs"
          />
          <div class="download-btn">
            <el-button @click="downloadQr">
              <el-icon><Download /></el-icon>
              <span>{{ $t('download') }}</span>
            </el-button>
          </div>
        </div>

        <el-button
          type="primary"
          class="sponsor-code-btn"
          @click="dialogTableVisible = true"
        >
          <EmotionHappy
            theme="outline"
            size="20"
            style="margin-right: 5px"
          />
          {{ $t('sponsor-code') }}
        </el-button>
      </div>
    </div>

    <el-dialog
      v-model="dialogTableVisible"
      :title="$t('sponsor-people')"
      width="65%"
    >
      <img
        src="@/assets/sponsor-code.png"
        alt=""
        class="sponsor-code"
      />
    </el-dialog>
  </div>
</template>

<style scoped>
  .home {
    font-size: 14px;
  }

  .addView-line {
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    .addView-line-label {
      margin-right: 10px;
      font-size: 14px;
      white-space: nowrap;
    }
  }

  .collapse-line-list {
    margin: 10px 0;
  }

  .collapse-line {
    display: flex;
    flex-wrap: nowrap;
    /* justify-content: space-between; */
    margin-bottom: 10px;
    /* height: 24px; */
  }

  .collapse-line-filed {
    margin-right: 5px;
  }

  .collapse-line-other {
    display: flex;
    justify-content: flex-end;
  }

  .collapse-line-value {
    /* margin: 0 5px; */
  }

  .collapse-delete {
    padding: 5px;
    /* height: 24px; */
  }

  .default-url {
    margin-top: 24px;
  }

  .default-url-text {
    margin-top: 24px;
  }

  .url-label {
    display: flex;
    align-items: center;
    .icon {
      color: #245bdb;
      padding: 2px;
      &:hover {
        cursor: pointer;
        background-color: #3370ff1a;
      }
    }
  }

  .url {
    display: inline-block;
    margin-top: 10px;
    max-width: 100%;
    color: #245bdb;
    word-wrap: break-word;
    text-decoration: none;
    white-space: normal;

    &:hover {
      opacity: 0.8;
      cursor: pointer;
      color: #3370ff;
    }
  }

  .tip-error {
    color: #f54a45;
    display: flex;
    align-items: center;
    font-size: 14px;
    line-height: 16px;
    span {
      margin: 0 3px;
    }
  }

  .refresh {
    margin: 10px 0;
  }

  .tip {
    color: #8f959e;
    font-size: 12px;
    margin-bottom: 24px;
    .tip-text {
      margin-bottom: 4px;
    }

    .title {
      font-size: 14px;
      margin-bottom: 8px;
    }
  }
  .tip-icon {
    position: relative;
    top: 2px;
  }

  .cursor {
    cursor: pointer;
  }

  .collapse {
    margin-bottom: 14px;
  }
  .mr5 {
    margin-right: 5px;
  }

  .more {
    display: inline-flex;
    align-items: center;
    margin-top: 5px;
    color: #1456f0;
    cursor: pointer;

    span {
      /* margin-left: 5px; */
      padding-left: 2px;
    }

    div {
      position: relative;
      top: 2px;
    }
  }

  .url-icon {
    display: inline-flex;
    align-items: center;
    font-size: 16px;
    margin-right: 18px;
    color: #1456f0;
    &:hover {
      cursor: pointer;
    }

    span {
      padding-left: 4px;
    }
  }

  .url-icon-preview {
    position: relative;
  }

  .url-icon-preview::after {
    content: '';
    position: absolute;
    top: 0;
    right: -9px; /* 调整竖线的位置 */
    height: 100%;
    width: 1.5px; /* 竖线的宽度 */
    background-color: rgba(31, 35, 41, 0.15); /* 竖线的颜色 */
  }

  .add-icon {
    margin-right: 5px;
  }

  .add {
    color: #1456f0 !important;
    font-size: 16px;
  }

  .line1 {
    margin-right: 12px;
    display: flex;
    align-items: center;
  }

  .edit {
    margin: 0 10px 0 5px;
    &:hover {
      color: #1456f0 !important;
      cursor: pointer;
    }
  }

  .qr-code-class {
    margin-top: 20px;
    display: inline-block;
    text-align: center;
    padding: 10px 12px;
    border-radius: 6px;
    background-color: #fff;
    border: 1px solid #dee0e3;
  }

  .qr-code-text {
    margin-bottom: 10px;
    font-size: 16px;
    color: #1f2329;
  }

  .download-btn {
    margin-top: 10px;
  }

  .qr-code-img {
    box-sizing: border-box;
  }

  .option-btn {
    margin-right: 5px;
    &:hover {
      cursor: pointer;
    }
  }

  .show {
    display: flex;
    align-items: center;
    white-space: nowrap;
    margin: 0 2px 0 8px;
  }

  .option-class {
    padding: 2px 10px;
    border-radius: 20px;
  }

  .sponsor-code {
    /* width: 180px; */
    width: 100%;
    /* height: 180px; */
  }

  .sponsor-code-btn {
    margin: 10px 0;
  }
</style>

<style>
  .el-popper.is-customized {
    padding: 6px 12px;
    background: linear-gradient(90deg, rgb(159, 229, 151), rgb(204, 229, 129));
  }

  .el-popper.is-customized .el-popper__arrow::before {
    background: linear-gradient(45deg, #b2e68d, #bce689);
    right: 0;
  }
</style>
