/*
 * @Version    : v1.00
 * @Author     : itchaox
 * @Date       : 2023-09-25 20:55
 * @LastAuthor : itchaox
 * @LastTime   : 2024-01-14 15:43
 * @desc       :
 */
import { createApp } from 'vue';
import App from './App.vue';
import 'element-plus/dist/index.css';
import './assets/main.css';

import { i18n } from './locales/i18n.js';

import ElementPlus from 'element-plus';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import en from 'element-plus/dist/locale/en.mjs';

import { bitable } from '@lark-base-open/js-sdk';

import * as ElementPlusIconsVue from '@element-plus/icons-vue';

const app = createApp(App);
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

bitable.bridge.getLanguage().then((lang) => {
  i18n.global.locale = lang;
  const _isZh = lang === 'zh' || lang === 'zh-HK' || lang === 'zh-TW';

  app.use(ElementPlus, {
    locale: _isZh ? zhCn : en,
  });
});

app.use(i18n);

app.mount('#app');
