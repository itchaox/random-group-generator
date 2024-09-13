<!--
 * @Version    : v1.00
 * @Author     : itchaox
 * @Date       : 2023-09-26 15:10
 * @LastAuthor : Wang Chao
 * @LastTime   : 2024-09-13 22:57
 * @desc       : 
-->
<script setup>
  import { ref, onMounted } from 'vue';
  import { bitable, FieldType, DateFormatter } from '@lark-base-open/js-sdk';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import find from '../utils';

  import { useI18n } from 'vue-i18n';

  const { t } = useI18n();

  const base = bitable.base;

  const fieldOptions = ref();
  const fieldId = ref();

  let dateFormatList = [
    {
      name: 't1',
      value: '无',
    },
    {
      name: 't2',
      value: '-',
    },
    {
      name: 't3',
      value: '_',
    },
    {
      name: 't4',
      value: '/',
    },
  ];
  let dateFormat = ref();

  const loading = ref(false);

  onMounted(async () => {
    const table = await base.getActiveTable();
    const view = await table.getActiveView();
    const tableMetaList = await view.getFieldMetaList();
    fieldOptions.value = tableMetaList.map((item) => ({ value: item.id, label: item.name }));
  });

  async function confirm() {
    // debugger;
    generateBirthdayRow();
  }

  // 所属地列
  const areaId = ref();

  const recordIds = [];

  async function getAllRecordIdList(_pageToken = 0) {
    const table = await base.getActiveTable();
    const data = await table.getRecordIdListByPage({ pageSize: 200, pageToken: _pageToken }); // 获取所有记录 id
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

  /**
   * @desc  : 生成手机号码所属地列
   */
  async function generateBirthdayRow() {
    loading.value = true;

    const table = await base.getActiveTable();
    // const field = await table.getField(areaId.value); // 选择某个多行文本字段

    await getAllRecordList();
    await getAllRecordIdList();

    let _list = [];
    for (let index = 0; index < recordList.length; index++) {
      const _field = await table.getFieldById(fieldId.value);
      const cell = await _field.getCell(recordList[index]?.id);
      const val = await cell.val;

      if (!val) continue;
      const value = val[0]?.text || val;
      console.log('🚀  value:', value);
      personList.value.push(value);

      // const area = find(val[0]?.text || val);

      // let format = !['无', 'none', 'なし'].includes(dateFormat.value) ? dateFormat.value : '';

      // // 根据手机号码获取手机号码所属地
      // _list.push({
      //   recordId: recordIds[index],
      //   fields: {
      //     [field.id]: area.province ? area.province + format + area.city : `【${t('Wrong format of phone number')}】`,
      //     [operatorId.value]: area.op !== '异常' ? area.op : `【${t('Wrong format of phone number')}】`,
      //   },
      // });
    }

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
                  .slice(i * (n + 1), (i + 1) * (n + 1))
                  .map((item, index) => (index === 0 ? item + '【组长】' : item))
              : personList.value.slice(i * (n + 1), (i + 1) * (n + 1)),
          );
        } else {
          // 剩余组分配 n 个人
          const startIdx = i * n + remainder;
          const endIdx = startIdx + n;
          _arr.push(
            isSelectLeader.value
              ? personList.value.slice(startIdx, endIdx).map((item, index) => (index === 0 ? item + '【组长】' : item))
              : personList.value.slice(startIdx, endIdx),
          );
        }
      }
    } else if (groupRule.value === 2) {
      // 根据每组人数分组
      const n = groupNumber.value; // 每组人数
      const groupCount = Math.ceil(personList.value.length / n); // 组数

      for (let i = 0; i < groupCount; i++) {
        _arr.push(
          isSelectLeader.value
            ? personList.value.slice(i * n, (i + 1) * n).map((item, index) => (index === 0 ? item + '【组长】' : item))
            : personList.value.slice(i * n, (i + 1) * n),
        );
      }
    }
    console.log(personList.value);

    console.log('🚀  _arr:', _arr);

    return;

    await table.setRecords(_list);

    loading.value = false;
    ElMessage({
      message: t('Data processing completed'),
      type: 'success',
    });
  }

  const operatorId = ref();

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
      <div class="title top">分组规则</div>
      <div>
        <el-radio-group v-model="groupRule">
          <el-radio
            size="large"
            :label="1"
            >小组数量</el-radio
          >
          <el-radio
            size="large"
            :label="2"
            >每组人数</el-radio
          >
        </el-radio-group>
      </div>
    </div>

    <div class="line">
      <div class="title top">分组数量</div>
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
      <div class="title top">选择组长</div>
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
    width: 85px;
  }

  .top {
  }

  .btn {
    margin-top: 20px;
  }
</style>
