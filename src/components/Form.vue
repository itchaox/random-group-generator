<!--
 * @Version    : v1.00
 * @Author     : itchaox
 * @Date       : 2023-09-26 15:10
 * @LastAuthor : Wang Chao
 * @LastTime   : 2024-09-14 10:18
 * @desc       : 
-->
<script setup>
  import { ref, onMounted } from 'vue';
  import { bitable, FieldType, DateFormatter } from '@lark-base-open/js-sdk';
  import { ElMessage, ElMessageBox } from 'element-plus';

  import { useI18n } from 'vue-i18n';

  const { t } = useI18n();

  const base = bitable.base;

  const fieldOptions = ref();
  const fieldId = ref();

  const loading = ref(false);

  const lang = ref('');
  onMounted(async () => {
    const table = await base.getActiveTable();
    const view = await table.getActiveView();
    const tableMetaList = await view.getFieldMetaList();

    // 只允许文本和人员字段
    fieldOptions.value = tableMetaList
      .filter((i) => i.type === 1 || i.type === 11)
      .map((item) => ({ value: item.id, label: item.name }));

    bitable.bridge.getLanguage().then((_lang) => {
      lang.value = _lang;
    });
  });

  function getTeamName() {
    if (['zh', 'zh-TW', 'zh-HK'].includes(lang.value)) {
      return '团队';
    } else if (lang.value === 'ja') {
      return 'チーム';
    } else {
      return 'Team';
    }
  }

  function getLeaderName() {
    if (['zh', 'zh-TW', 'zh-HK'].includes(lang.value)) {
      return '组长';
    } else if (lang.value === 'ja') {
      return 'チームリーダー';
    } else {
      return 'Team Leader';
    }
  }

  async function confirm() {
    generateBirthdayRow();
  }

  // 所属地列
  const areaId = ref();

  const recordIds = [];

  async function getAllRecordIdList(_pageToken = 0) {
    const table = await base.getActiveTable();
    const view = await table.getActiveView();

    const data = await view.getVisibleRecordIdListByPage({ pageSize: 200, pageToken: _pageToken }); // 获取所有记录 id
    const { total, hasMore, recordIds: recordIdsData, pageToken } = data;
    recordIds.push(...recordIdsData);
    if (hasMore) {
      await getAllRecordIdList(pageToken);
    }
  }

  const recordList = [];
  async function getAllRecordList(_pageToken = 0) {
    const table = await base.getActiveTable();
    const data = await table.getRecordListByPage({ pageSize: 200, pageToken: _pageToken });
    const { total, hasMore, records: recordsData, pageToken } = data;
    recordList.push(...recordsData);

    if (hasMore) {
      await getAllRecordList(pageToken);
    }
  }

  const personList = ref([]);

  // Fisher-Yates 洗牌算法 来随机打乱数组中的元素，这是一种常见且高效的打乱数组的算法
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      // 在 0 到 i 之间生成一个随机索引
      const j = Math.floor(Math.random() * (i + 1));
      // 交换 array[i] 和 array[j]
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * @desc  : 生成手机号码所属地列
   */
  async function generateBirthdayRow() {
    loading.value = true;

    const table = await base.getActiveTable();

    await getAllRecordList();
    await getAllRecordIdList();

    const _field = await table.getFieldById(fieldId.value);

    for (let index = 0; index < recordList.length; index++) {
      const cell = await _field.getCell(recordList[index]?.id);
      const val = await cell.val;
      console.log('🚀  val:', val);

      if (!val) continue;
      const value =
        val[0]?.text || (['zh', 'zh-TW', 'zh-HK'].includes(lang.value) ? val[0]?.name : val[0]?.enName) || val;
      personList.value.push(value);
    }

    personList.value = shuffleArray(personList.value);

    const _arr = [];

    if (groupRule.value === 1) {
      // 根据小组数量分组
      const n = Math.floor(personList.value.length / groupNumber.value); // 每组至少多少人
      const remainder = personList.value.length % groupNumber.value; // 多余的几个人

      for (let i = 0; i < groupNumber.value; i++) {
        if (i < remainder) {
          // 前 remainder 组分配 n+1 个人
          _arr.push(
            isSelectLeader.value
              ? personList.value
                  ?.slice(i * (n + 1), (i + 1) * (n + 1))
                  ?.map((item, index) => (index === 0 ? item + `【${getLeaderName()}】` : item))
              : personList.value?.slice(i * (n + 1), (i + 1) * (n + 1)),
          );
        } else {
          // 剩余组分配 n 个人
          const startIdx = i * n + remainder;
          const endIdx = startIdx + n;
          _arr.push(
            isSelectLeader.value
              ? personList.value
                  ?.slice(startIdx, endIdx)
                  ?.map((item, index) => (index === 0 ? item + `【${getLeaderName()}】` : item))
              : personList.value?.slice(startIdx, endIdx),
          );
        }
      }
    } else if (groupRule.value === 2) {
      // 根据每组人数分组
      const n = groupNumber.value; // 每组人数
      const groupCount = Math.ceil(personList.value?.length / n); // 组数

      for (let i = 0; i < groupCount; i++) {
        _arr.push(
          isSelectLeader.value
            ? personList.value
                ?.slice(i * n, (i + 1) * n)
                ?.map((item, index) => (index === 0 ? item + `【${getLeaderName()}】` : item))
            : personList.value?.slice(i * n, (i + 1) * n),
        );
      }
    }

    for (let i = 0; i < _arr.length; i++) {
      const fieldId = await table.addField({
        // 新增一个多行文本类型的字段
        type: FieldType.Text,
        name: `${getTeamName()} ${i + 1}`,
      });
      const _list = [];
      for (let j = 0; j < _arr[i].length; j++) {
        _list.push({
          recordId: recordIds[j],
          fields: {
            [fieldId]: _arr[i][j],
          },
        });
      }
      await table.setRecords(_list);
    }

    loading.value = false;

    ElMessage({
      message: t('Data processing completed'),
      type: 'success',
    });
  }

  // 分组规则
  const groupRule = ref(1);

  // 分组数量
  const groupNumber = ref(1);

  // 选择小组长
  const isSelectLeader = ref(false);
</script>

<template>
  <div
    v-loading="loading"
    :element-loading-text="$t('loading')"
  >
    <div class="line">
      <div class="title">{{ $t('Mobile phone number column') }}</div>
      <div>
        <el-select
          filterable
          v-model="fieldId"
          :placeholder="$t('Please select the mobile phone number column')"
          size="large"
          clearable
        >
          <el-option
            v-for="item in fieldOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
    </div>

    <div class="line">
      <div class="title top">{{ $t('fen-zu-gui-ze') }}</div>
      <div>
        <el-radio-group v-model="groupRule">
          <el-radio
            size="large"
            :label="1"
            >{{ $t('xiao-zu-shu-liang') }}</el-radio
          >
          <el-radio
            size="large"
            :label="2"
            >{{ $t('mei-zu-ren-shu') }}</el-radio
          >
        </el-radio-group>
      </div>
    </div>

    <div class="line">
      <div class="title top">{{ $t('fen-zu-shu-liang') }}</div>
      <div>
        <el-input-number
          v-model="groupNumber"
          :min="1"
          controls-position="right"
          size="large"
        />
      </div>
    </div>

    <div class="line">
      <div class="title top">{{ $t('xuan-ze-zu-chang') }}</div>
      <div>
        <el-switch
          v-model="isSelectLeader"
          size="large"
        />
      </div>
    </div>

    <el-button
      type="primary"
      class="btn"
      @click="confirm"
    >
      <el-icon size="22"><CaretRight /></el-icon>
      {{ $t('run') }}</el-button
    >
  </div>
</template>

<style scoped>
  .line {
    display: flex;
    align-items: center;
    margin-bottom: 14px;
  }

  .title {
    font-size: 16px;
    /* font-weight: 700; */
    margin-right: 5px;
    min-width: 85px;
    /* white-space: nowrap; */
  }

  .top {
  }

  .btn {
    margin-top: 20px;
  }
</style>
