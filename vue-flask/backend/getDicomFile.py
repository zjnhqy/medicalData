import os
import shutil
from pydicom.dataset import Dataset
from pydicom.uid import MRImageStorage
from pydicom.uid import CTImageStorage
from pynetdicom import AE, evt, build_role
from pynetdicom.sop_class import PatientRootQueryRetrieveInformationModelGet
from dcm2nii import dcm2niigz
from threading import Thread,Lock

#debug_logger()

# 添加dcm文件到文件夹的函数
# def dcm_add_to_folder(source_file, destination_folder):
#     # 确保目标文件夹存在
#     # 目标文件路径
#     destination = os.path.join(destination_folder, os.path.basename(source_file))
#
#     # 移动文件
#     try:
#         shutil.move(source_file, destination)
#         # print(f'文件已成功移动到 {destination}')
#     except Exception as e:
#         print(f'文件移动失败: {e}')




# 处理evt.EVT_C_STORE事件的函数
store_threads = []
# 锁，用于线程安全地修改共享资源
lock = Lock()


# 存储DICOM数据集的函数
def store_dataset(ds, destination_folder):
    """在单独的线程中存储DICOM数据集。"""
    try:
        temp_file = os.path.join(destination_folder, ds.SOPInstanceUID + '.dcm')
        ds.save_as(temp_file, write_like_original=False)
        # print(f'文件已存储：{temp_file}')
    except Exception as e:
        print(f'存储失败: {e}')


# 处理evt.EVT_C_STORE事件的函数
def handle_store(event):
    """处理C-STORE事件，并在单独的线程中存储数据集。"""
    ds = event.dataset
    destination_folder = 'dcm2nii'



    # 创建存储线程
    store_thread = Thread(target=store_dataset, args=(ds, destination_folder))

    # 在锁的保护下将线程添加到列表
    with lock:
        store_threads.append(store_thread)
        store_thread.start()

    return 0x0000

# 注册事件处理程序
handlers = [(evt.EVT_C_STORE, handle_store)]

# 初始化应用程序实体
ae = AE()

# 添加请求的呈现上下文（QR SCU）
ae.add_requested_context(PatientRootQueryRetrieveInformationModelGet)
# 添加请求的呈现上下文（Storage SCP）
# ae.add_requested_context(MRImageStorage)
ae.add_requested_context(CTImageStorage)

# 为CT Image Storage创建SCP/SCU角色选择协商项
# role_MR = build_role(MRImageStorage, scp_role=True)
role_CT = build_role(CTImageStorage, scp_role=True)

def getDicomFile(PatientID,StudyInstanceUID,SeriesInstanceUID):
    # 创建标识符（查询）数据集
    ds = Dataset()
    ds.QueryRetrieveLevel = 'SERIES'
    ds.PatientID = PatientID
    ds.StudyInstanceUID = StudyInstanceUID

    ds.SeriesInstanceUID = SeriesInstanceUID

    destination_folder = 'dcm2nii'

    if not os.path.isdir(destination_folder):
        os.makedirs(destination_folder)

    # 与对等AE在IP 127.0.0.1和端口11112上关联
    assoc = ae.associate("127.0.0.1", 104, ext_neg=[role_CT], evt_handlers=handlers)

    if assoc.is_established:
        # 使用C-GET服务发送标识符
        responses = assoc.send_c_get(ds, PatientRootQueryRetrieveInformationModelGet)
        for (status, _) in responses:
            if not status:
                print('连接超时，被中止或收到无效响应')

        # 释放关联
        assoc.release()
    else:
        print('关联被拒绝，中止或从未连接')

    with lock:
        for thread in store_threads:
            thread.join()  # 等待每个线程完成

    # print('所有文件已存储，开始执行dcm2niigz转换...')
    niipath = 'test.nii.gz'

    dcm2niigz(destination_folder, niipath)



    return os.path.join(os.getcwd(), 'test.nii.gz')

