import SimpleITK as sitk
import shutil

# dicom即文件夹存储的dcm后缀文件转为nii或nii.gz或nrrd格式
# dicom文件夹目录  niipath:要保存的文件名
# 您只需要修改niipath文件的后缀名为.nii .nii.gz .nrrd便可以直接实现三种格式的保存
def dcm2niigz(dcmpath, niipath):
    reader = sitk.ImageSeriesReader()
    dicom_names = reader.GetGDCMSeriesFileNames(dcmpath)
    reader.SetFileNames(dicom_names)
    image2 = reader.Execute()

    image_array = sitk.GetArrayFromImage(image2)
    origin = image2.GetOrigin()
    spacing = image2.GetSpacing()
    direction = image2.GetDirection()
    image3 = sitk.GetImageFromArray(image_array)

    image3.SetSpacing(spacing)
    image3.SetDirection(direction)
    image3.SetOrigin(origin)

    sitk.WriteImage(image3, niipath)
    #shutil.rmtree(dcmpath)

# oripath = r'D:\nii'  # dicom文件夹
# # savepath1 = r'D:\Google下载文件\57d18fa9-f3c366c4-3d61c00a-fb5892bd-0535bfbf\test.nii.gz'  # 转换为nii
# savepath2 = r'D:\nii\test.nii.gz'  # 转换为nii.gz
# # savepath3 = r'C:\Users\QDUMIAO\Desktop\ori.nii.nrrd'  # 转换为nrrd

# dcm2niigz(oripath, savepath1)
# dcm2niigz(oripath, savepath2)
# dcm2niigz(oripath, savepath3)