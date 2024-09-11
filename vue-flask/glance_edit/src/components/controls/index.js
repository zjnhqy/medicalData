import ColorBy from 'paraview-glance/src/components/controls/ColorBy';
import Information from 'paraview-glance/src/components/controls/Information';
import Molecule from 'paraview-glance/src/components/controls/Molecule';
import Representation from 'paraview-glance/src/components/controls/Representation';
import Slice from 'paraview-glance/src/components/controls/SliceControl';

export default [
  {
    component: Representation,
    defaultExpand: true,
    icon: 'mdi-brightness-6',
    name: '表示',
    visible: (source) =>
      source.getDataset().isA('vtkPolyData') ||
      source.getDataset().isA('vtkImageData'),
  },
  {
    component: ColorBy,
    defaultExpand: true,
    icon: 'mdi-invert-colors',
    name: '颜色',
    visible: (source) =>
      source.getDataset().isA('vtkPolyData') ||
      source.getDataset().isA('vtkImageData'),
  },
  {
    component: Slice,
    defaultExpand: true,
    icon: 'mdi-tune',
    name: '切片',
    visible: (source) => source.getDataset().isA('vtkImageData'),
  },
  {
    component: Molecule,
    defaultExpand: true,
    icon: 'mdi-molecule',
    name: '分子',
    visible: (source) => source.getDataset().isA('vtkMolecule'),
  },
  {
    component: Information,
    defaultExpand: false,
    icon: 'mdi-help-circle-outline',
    name: '信息',
    visible: (source) =>
      source.getDataset().isA('vtkPolyData') ||
      source.getDataset().isA('vtkImageData'),
  },
];
