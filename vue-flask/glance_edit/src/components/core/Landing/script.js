import samples from 'paraview-glance/src/samples';
import DragAndDrop from 'paraview-glance/src/components/widgets/DragAndDrop';

export default {
  name: 'Landing',
  components: {
    DragAndDrop,
  },
  data() {
    return {
      samples,
      version: window.GLANCE_VERSION || 'no version available',
      words: [], // 字母数组push，pop的载体
      str: '深度学习生成医疗影像报告有助于提早发现和治疗疾病', // str初始化
      letters: [], // str分解后的字母数组
      order: 1, // 表示当前是第几句话
    };
  },
  methods: {
    openSample(sample) {
      const urls = [];
      const names = [];
      for (let i = 0; i < sample.datasets.length; ++i) {
        urls.push(sample.datasets[i].url);
        names.push(sample.datasets[i].name);
      }
      this.$emit('open-urls', sample.label, urls, names);
    },
    // 开始输入的效果动画
    begin() {
      let i = 0;
      this.letters = this.str.split('');
      for (; i < this.letters.length; i++) {
        setTimeout(this.write(i), i * 100);
      }
    },
    // 开始删除的效果动画
    back() {
      let i = 0;
      const L = this.letters.length;
      for (; i < L; i++) {
        setTimeout(this.wipe(i), i * 50);
      }
    },
    // 输入字母
    write(i) {
      return () => {
        const L = this.letters.length;
        this.words.push(this.letters[i]);
        const that = this;
        if (i === L - 1) {
          setTimeout(function () {
            that.back();
          }, 2000);
        }
      };
    },
    // 擦掉(删除)字母
    wipe(i) {
      return () => {
        this.words.pop(this.letters[i]);
        /* 如果删除完毕，在300ms后开始输入 */
        if (this.words.length === 0) {
          this.order++;
          const that = this;
          setTimeout(function () {
            that.begin();
          }, 300);
        }
      };
    },
  },

  watch: {
    // 监听order值的变化，改变str的内容
    order() {
      if (this.order % 4 === 1) {
        this.str = '深度学习生成医疗影像报告有助于提早发现和治疗疾病';
      } else if (this.order % 4 === 2) {
        this.str = '支持远程分享医学图像和分析结果，方便多名人员协作 ';
      } else if (this.order % 4 === 3) {
        this.str = '集成自动分割工具，能快速准确地标记和分割图像中的结构';
      } else {
        this.str = '交互式操作，能够直观友好地查看和分析医学图像';
      }
    },
  },
  mounted() {
    // 页面初次加载后调用begin()开始动画
    this.begin();
  },
};
