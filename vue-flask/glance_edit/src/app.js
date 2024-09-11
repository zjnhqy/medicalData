/* eslint-disable import/prefer-default-export */
import Vue from 'vue';
import Vuex from 'vuex';
import Vuetify from 'vuetify/lib';
import PortalVue from 'portal-vue';

import GirderProvider from 'paraview-glance/src/girder';
import { vuetify as girderVuetify } from '@girder/components/src';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

import '@kitware/vtk.js/Rendering/Profiles/All';

import vtkURLExtract from '@kitware/vtk.js/Common/Core/URLExtract';
import vtkProxyManager from '@kitware/vtk.js/Proxy/Core/ProxyManager';

import 'typeface-roboto/index.css';
import '@mdi/font/css/materialdesignicons.css';
import 'paraview-glance/static/global.css';
import 'paraview-glance/src/store/fileLoader';
// side-effect: register readers
import 'paraview-glance/src/io/ParaViewGlanceReaders';
// side-effect: register presets
import 'paraview-glance/src/config/ColorMaps';

import ReaderFactory from 'paraview-glance/src/io/ReaderFactory';
import App from 'paraview-glance/src/components/core/App';
import Config from 'paraview-glance/src/config';
import createStore from 'paraview-glance/src/store';
import { ProxyManagerVuePlugin } from 'paraview-glance/src/plugins/proxyManagerPlugins';
import Settings from 'paraview-glance/src/settings';
import ToolSvgPortalPlugin from 'paraview-glance/src/plugins/toolSvgPortal';
import JSZip from 'jszip';

// Expose IO API to Glance global object
export const {
  getReader,
  importBase64Dataset,
  listReaders,
  listSupportedExtensions,
  loadFiles,
  openFiles,
  registerReader,
  registerReadersToProxyManager,
} = ReaderFactory;

Vue.use(Vuex);
Vue.use(Vuetify);
Vue.use(ProxyManagerVuePlugin);
Vue.use(PortalVue);
Vue.use(ToolSvgPortalPlugin);
Vue.use(ElementUI);
// Vue.use(Element, { size: 'small', zIndex: 3000 });

let activeProxyConfig = null;
/**
 * Sets the active proxy configuration to be used by createViewer.
 *
 * Once createViewer() is called, setActiveProxyConfiguration will do nothing.
 * Proxy config precedence (decreasing order):
 *   createViewer param, active proxy config, Generic config
 */
export function setActiveProxyConfiguration(config) {
  activeProxyConfig = config;
}

export function createViewer(container, proxyConfig = null) {
  const proxyConfiguration = proxyConfig || activeProxyConfig || Config.Proxy;
  const proxyManager = vtkProxyManager.newInstance({ proxyConfiguration });
  const settings = new Settings();

  const store = createStore({
    proxyManager,
    girder: GirderProvider,
  });

  const app = new Vue({
    el: container,
    components: { App },
    store,
    provide: GirderProvider,
    render: (h) => h(App),
    // if in the future we want to configure vuetify ourselves, see
    // https://github.com/girder/girder_web_components/blob/master/README.md
    vuetify: girderVuetify,
    proxyManager,
    template: '<App />',
  });

  // support history-based navigation
  function onRoute(event) {
    const state = event.state || {};
    if (state.app) {
      store.commit('showApp');
    } else {
      store.commit('showLanding');
    }
  }

  store.watch(
    (state) => state.route,
    (route) => {
      if (settings.get('noHistory')) {
        return;
      }
      const state = window.history.state || {};
      if (route === 'landing' && state.app) {
        window.history.back();
      }
      if (route === 'app' && !state.app) {
        window.history.pushState({ app: true }, '');
      }
    }
  );

  window.history.replaceState({ app: false }, '');
  window.addEventListener('popstate', onRoute);

  // always enable history setting. Users must explicitly disable it.
  settings.set('noHistory', false);

  settings.syncWithStore(store, {
    collapseDatasetPanels: {
      set: (val) => store.dispatch('collapseDatasetPanels', val),
      get: (state) => state.collapseDatasetPanels,
    },
    suppressBrowserWarning: {
      set: (val) => store.dispatch('suppressBrowserWarning', val),
      get: (state) => state.suppressBrowserWarning,
    },
  });

  return {
    proxyManager,
    store,
    processURLArgs() {
      const params = vtkURLExtract.extractURLParameters();

      Object.keys(params)
        .filter((key) => key.startsWith('setting.'))
        .forEach((key) => {
          const name = key.substr('setting.'.length);
          settings.set(name, params[key]);
        });

      const { name, url } = params;
      if (name && url) {
        const names = Array.isArray(name) ? name : [name];
        const urls = Array.isArray(url) ? url : [url];

        // 判断是否为 zip 文件
        const isZip = names.some((u) => u.toLowerCase().endsWith('.zip'));

        // 如果是 zip 文件，则加载 zip 文件内容
        if (isZip) {
          urls.forEach((zipUrl) => {
            fetch(zipUrl)
              .then((response) => response.blob())
              .then((zipBlob) => {
                // 读取 zip 文件中的数据
                JSZip.loadAsync(zipBlob).then((zip) => {
                  const entries = Object.values(zip.files);

                  // 遍历 zip 文件中的每个文件条目
                  entries.forEach((entry) => {
                    // console.log('123', entry.dir);
                    if (!entry.dir) {
                      const entryName = entry.name;
                      const entryBlob = entry.async('blob');
                      console.log('here', entryBlob);
                      // 根据文件条目的名称和内容执行相应的操作
                      app.$children[0].autoLoadRemotes(
                        'zip file',
                        [entryBlob],
                        [entryName]
                      );
                    }
                  });
                });
              })
              .catch((error) => {
                console.error('Error loading zip file:', error);
              });
          });
        } else {
          // 如果不是 zip 文件，则按照常规方式加载数据
          app.$children[0].autoLoadRemotes('resources from url', urls, names);
        }
      }
    },

    // All components must have a unique name
    addDatasetPanel(component) {
      store.commit('addPanel', { component });
    },
    showApp() {
      store.commit('showApp');
    },
    getSetting(name) {
      return settings.get(name);
    },
    setSetting(name, value) {
      return settings.set(name, value);
    },
  };
}
