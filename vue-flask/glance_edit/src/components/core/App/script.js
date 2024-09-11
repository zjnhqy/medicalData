import { mapGetters, mapState, mapActions, mapMutations } from 'vuex';
import Mousetrap from 'mousetrap';
import { VBottomSheet, VDialog } from 'vuetify/lib';
import macro from '@kitware/vtk.js/macro';

import AboutBox from 'paraview-glance/src/components/core/AboutBox';
import BrowserIssues from 'paraview-glance/src/components/core/BrowserIssues';
import ControlsDrawer from 'paraview-glance/src/components/core/ControlsDrawer';
import DragAndDrop from 'paraview-glance/src/components/widgets/DragAndDrop';
import ErrorBox from 'paraview-glance/src/components/core/ErrorBox';
import FileLoader from 'paraview-glance/src/components/core/FileLoader';
import Landing from 'paraview-glance/src/components/core/Landing';
import LayoutView from 'paraview-glance/src/components/core/LayoutView';
import Screenshots from 'paraview-glance/src/components/core/Screenshots';
import StateFileGenerator from 'paraview-glance/src/components/core/StateFileGenerator';
import SvgIcon from 'paraview-glance/src/components/widgets/SvgIcon';
import CollapsibleToolbar from 'paraview-glance/src/components/widgets/CollapsibleToolbar';
import CollapsibleToolbarItem from 'paraview-glance/src/components/widgets/CollapsibleToolbar/Item';
import girderRest from 'paraview-glance/src/components/core/GirderBox';
import shortcuts from 'paraview-glance/src/shortcuts';

export default {
  name: 'App',
  components: {
    AboutBox,
    BrowserIssues,
    CollapsibleToolbar,
    CollapsibleToolbarItem,
    ControlsDrawer,
    DragAndDrop,
    ErrorBox,
    FileLoader,
    girderRest,
    Landing,
    LayoutView,
    Screenshots,
    StateFileGenerator,
    SvgIcon,
    VBottomSheet,
    VDialog,
  },
  provide() {
    return {
      $notify: this.notify,
    };
  },
  data() {
    return {
      aboutDialog: false,
      errorDialog: false,
      fileUploadDialog: false,
      autoloadDialog: false,
      autoloadLabel: '',
      internalControlsDrawer: true,
      screenshotsDrawer: false,
      screenshotCount: 0,
      errors: [],
      globalSingleNotification: '',
      notifyPermanent: false,
      buttonText: '文件查看',
    };
  },
  computed: {
    controlsDrawer: {
      get() {
        return this.landingVisible ? false : this.internalControlsDrawer;
      },
      set(visible) {
        if (!this.landingVisible) {
          this.internalControlsDrawer = visible;
        }
      },
    },
    ...mapState({
      loadingState: 'loadingState',
      landingVisible: (state) => state.route === 'landing',
      screenshotsDrawerStateless(state) {
        return this.screenshotsDrawer && !!state.screenshotDialog;
      },
      smallScreen() {
        return this.$vuetify.breakpoint.smAndDown;
      },
      dialogType() {
        return this.smallScreen ? 'v-bottom-sheet' : 'v-dialog';
      },
    }),
    ...mapGetters('files', {
      anyFileLoadingErrors: 'anyErrors',
      fileLoadingProgress: 'totalProgress',
    }),
  },
  proxyManagerHooks: {
    onProxyModified() {
      if (!this.loadingState) {
        this.$proxyManager.autoAnimateViews();
      }
    },
  },
  created() {
    this.internalControlsDrawer = !this.smallScreen;
  },
  mounted() {
    this.$root.$on(() => {
      this.fileUploadDialog = true;
    });
    this.initViews();
    this.initializeAnimations();

    shortcuts.forEach(({ key, action }) =>
      Mousetrap.bind(key, (e) => {
        e.preventDefault();
        this.$store.dispatch(action);
      })
    );

    window.addEventListener('error', this.recordError);

    macro.setLoggerFunction('error', (...args) => {
      this.recordError(args.join(' '));
      window.console.error(...args);
    });
  },
  beforeDestroy() {
    window.removeEventListener('error', this.recordError);
    shortcuts.forEach(({ key }) => Mousetrap.unbind(key));
  },
  methods: {
    ...mapMutations({
      showApp: 'showApp',
      showLanding: 'showLanding',
      toggleControlsDrawer() {
        this.controlsDrawer = !this.controlsDrawer;
      },
      toggleLanding() {
        this.landingVisible = !this.landingVisible;
        if (this.landingVisible) {
          this.buttonText = '返回';
          // 执行显示应用程序的逻辑
          this.showApp();
        } else {
          this.buttonText = '文件查看';
          // 执行显示登陆的逻辑
          this.showLanding();
        }
      },
    }),
    ...mapActions({
      saveState: 'saveState',
      initViews: 'views/initViews',
    }),
    ...mapActions('files', [
      'openFiles',
      'openRemoteFiles',
      'load',
      'resetQueue',
    ]),
    ...mapActions('animations', ['initializeAnimations']),
    showFileUpload() {
      this.fileUploadDialog = true;
    },
    openFileList(fileList) {
      this.fileUploadDialog = true;
      this.$nextTick(() => this.openFiles(Array.from(fileList)));
      // console.log(fileList);
    },
    autoLoadRemotes(label, urls, names) {
      const remotes = urls.map((url, index) => ({
        name: names[index],
        url,
      }));
      this.autoloadDialog = true;
      this.autoloadLabel = label;

      // console.log('Attempting to load remotes:', remotes);

      setTimeout(
        () =>
          this.openRemoteFiles(remotes)
            .then((response) => {
              console.log('Remote files loaded successfully:', response);
              return this.load();
            })
            .catch((error) => {
              console.error('Error loading remote files:', error);
              // Add code to handle error, such as displaying an error message
            })
            .then(() => {
              // Add logging to check file information after loading
              // console.log(
              //   'File information after loading:',
              //   this.$store.state.loadingState
              // );

              if (this.anyFileLoadingErrors) {
                this.$nextTick(() => {
                  this.fileUploadDialog = true;
                });
              } else {
                this.doneLoadingFiles();
              }
            })
            .finally(() => {
              this.resetQueue();
              this.autoloadDialog = false;
            }),
        // hack to allow loading sample dialog to show up
        10
      );
    },

    doneLoadingFiles() {
      this.showApp();
    },
    recordError(error) {
      this.errors.push(error);
    },
    notify(msg, permanent = false) {
      if (this.globalSingleNotification) {
        this.globalSingleNotification = '';
        this.permanent = false;
      }
      this.$nextTick(() => {
        this.globalSingleNotification = msg;
        this.notifyPermanent = permanent;
      });
    },
  },
};
