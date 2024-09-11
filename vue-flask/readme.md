//运行方法
cd vue-flask ; npm start

//日志
D:\vue-flask\vue-flask\glance_edit\src\store\fileLoader.js有关上传文件的源代码    3.22 
static/ParaView.png  需要更换为自己的logo                                         8.14
static/icon目录下  需要更换为自己的logo                                           8.14
data目录下需要更换为自己的样例文件                                                 8.14
src/samples/images目录下需要更换为自己的样例图片                                   8.14
移除了src/girder.js文件                                                          8.14 
移除了src/components/core/girder目录                                             8.14
实现了nii.gz和dcm文件之间的互相转换，用dcm存储，nii.gz查看                          8.15
实现了dicom文件多线程传输，速度大幅提升                                            8.27
delete没办法通过pynetdicom实现，决定去除删除功能，改为下载                          8.28
复原了girder功能，因为他和远程仓库有关                                             9.3
设置了三个脑部sample文件，存储在github仓库                                         9.3