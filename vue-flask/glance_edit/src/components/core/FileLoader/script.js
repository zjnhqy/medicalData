import { mapGetters, mapState, mapActions } from 'vuex';
// import { Message } from 'element-ui';
// import axios from 'axios';
import RawFileReader from 'paraview-glance/src/components/core/RawFileReader';
import DragAndDrop from 'paraview-glance/src/components/widgets/DragAndDrop';
// import GirderBox from 'paraview-glance/src/components/core/GirderBox';
import axios from 'axios';
import { Loading } from 'element-ui';

export default {
  name: 'FileLoader',
  components: {
    RawFileReader,
    DragAndDrop,
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isLoading: false,
      loading: false,
      active_tab: 0,
      tableData: [
        // { date: '2024-03-24', name: 'John Doe', address: '123 Main St' },
        // { date: '2024-03-25', name: 'Jane Smith', address: '456 Elm St' },
        // { date: '2024-03-26', name: 'Alice Johnson', address: '789 Oak St' },
        // // Add more data as needed
      ],
      input: '',
      input1: '',
      // selectedDate: '',
    };
  },
  computed: {
    ...mapState('files', {
      fileList: (state) => Array.from(state.fileList).reverse(),
      pendingFiles: (state) =>
        state.fileList.reduce(
          (flag, file) =>
            flag || (file.state !== 'ready' && file.state !== 'error'),
          false
        ),
      hasReadyFiles: (state) =>
        state.fileList.reduce(
          (flag, file) => flag || file.state === 'ready',
          false
        ),
    }),
    ...mapGetters('files', ['anyErrors']),
  },
  // mounted() {
  //   this.fetchData();
  //   // console.log('this.$el:', this.$el);
  //   // console.log('this.$el.querySelectorAll:', this.$el.querySelectorAll);
  // },
  methods: {
    ...mapActions('files', [
      'openFiles',
      'promptLocal',
      'deleteFile',
      'setRawFileInfo',
      'load',
      'resetQueue',
    ]),
    // isValidFileType(file) {
    //   // 定义允许的文件扩展名
    //   const validExtensions = ['.nii.gz', '.nii', '.dcm'];
    //   // 获取文件的名称并提取扩展名
    //   const fileName = file.name;
    //   const extension = fileName
    //     .substring(fileName.lastIndexOf('.'))
    //     .toLowerCase();
    //   // 检查扩展名是否在允许的列表中
    //   return validExtensions.includes(extension);
    // },
    fetchDICOMFiles(rowData) {
      const loadingInstance = Loading.service({
        lock: true,
        text: '正在加载，请稍候',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)',
      });
      axios
        .get('http://localhost:5000/api/get_dicom_file', {
          params: {
            PatientID: rowData.PatientID,
            StudyInstanceUID: rowData.StudyInstanceUID,
            SeriesInstanceUID: rowData.SeriesInstanceUID,
          },
          responseType: 'blob',
        })
        .then((response) => {
          // 构造一个 File 对象数组
          const file = new File([response.data], 'DiCOM_file.nii.gz', {
            type: 'application/nii.gz', // 设置文件类型为 DICOM
          });
          const fileArray = [file]; // 文件数组
          // 调用 openFiles 方法并传入文件数组
          this.openFiles(fileArray)
            .then(() => {
              // 后续操作
              loadingInstance.close();
            })
            .catch((error) => {
              console.error('Error opening files:', error);
              // this.isLoading = false;
              loadingInstance.close();
            });
        })
        .catch((error) => {
          console.error('Error fetching DICOM file:', error);
        });
    },

    fetchData() {
      axios
        .get('http://localhost:5000/api/get_uploaded_files')
        .then((response) => {
          this.tableData = response.data;
        })
        .catch((error) => {
          console.error('Error fetching data:', error);
        });
    },

    loadFiles() {
      this.loading = true;
      this.load().finally(() => {
        this.close();
        this.$emit('load');
        setTimeout(() => {
          this.loading = false;
        }, 10);
      });
    },

    deleteFileAtRevIndex(revIdx) {
      // console.log('1');
      return this.deleteFile(this.fileList.length - 1 - revIdx);
    },

    setRawFileInfoAtRevIndex(revIdx, info) {
      return this.setRawFileInfo({
        index: this.fileList.length - 1 - revIdx,
        info,
      });
    },

    onDialogChange(state) {
      if (!state) {
        this.close();
      } else {
        this.$emit('input', true);
      }
    },

    close() {
      this.$emit('input', false);
      setTimeout(() => this.resetQueue(), 10);
    },
    searchFilesByName(input) {
      console.log(input);
      axios
        .get('http://localhost:5000/api/searchByName', {
          params: {
            PatientName: input,
          },
        })
        .then((response) => {
          this.tableData = response.data;
        })
        .catch((error) => {
          console.error('Error fetching data:', error);
        });
    },
    searchFilesById(input1) {
      console.log(input1);
      axios
        .get('http://localhost:5000/api/searchById', {
          params: {
            PatientID: input1,
          },
        })
        .then((response) => {
          this.tableData = response.data;
        })
        .catch((error) => {
          console.error('Error fetching data:', error);
        });
    },
  },
};
