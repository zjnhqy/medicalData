from pydicom.dataset import Dataset
from pynetdicom import AE, debug_logger
from pynetdicom.sop_class import PatientRootQueryRetrieveInformationModelFind
from pynetdicom.sop_class import StudyRootQueryRetrieveInformationModelFind

# 启用调试日志
#debug_logger()

# 创建一个 Application Entity (AE) 实例
ae = AE(ae_title='PYNETDICOM')

# 添加所需的查询上下文
ae.add_requested_context(PatientRootQueryRetrieveInformationModelFind)
ae.add_requested_context(StudyRootQueryRetrieveInformationModelFind)

def get_patient_name(patient_name):
    """
    将 PatientName 属性中的姓和名合并成一个字符串返回
    :param patient_name: DICOM 数据集中的 PatientName 属性
    :return: 姓和名合并后的字符串
    """
    if patient_name:
        # 使用 str() 方法将 PersonName 对象转换为字符串
        patient_name_str = str(patient_name)
        return patient_name_str
    else:
        return ""



def searchByName(Name):

    # 创建查询数据集（Identifier）
    ds = Dataset()
    ds.PatientID = ''  # 设置查询的患者 ID
    ds.StudyDate = ''
    ds.QueryRetrieveLevel = 'PATIENT'  # 设置查询的级别为患者级别
    ds.StudyInstanceUID = ''
    ds.SeriesInstanceUID = ''
    ds.PatientName = Name
    ds.PatientBirthDate = ''

    # 与目标 DICOM 服务器建立关联（Association）
    assoc = ae.associate("127.0.0.1", 104)  # 连接到 IP 地址为 127.0.0.1，端口为 104 的 DICOM 服务器

    if assoc.is_established:
        # 发送 C-FIND 请求
        responses = assoc.send_c_find(ds, PatientRootQueryRetrieveInformationModelFind)
        results=[]
        for (status, identifier) in responses:
            if status and identifier:
                # 提取并合并患者姓名sdf
                patient_name = get_patient_name(identifier.PatientName)
                results.append({'PatientID':identifier.PatientID, 'StudyDate':identifier.StudyDate,
                                'PatientName': patient_name, 'PatientBirthDate':identifier.PatientBirthDate,
                                'StudyInstanceUID': identifier.StudyInstanceUID,
                                'SeriesInstanceUID': identifier.SeriesInstanceUID
                                })
        # 释放关联
        assoc.release()
        return results
    else:
        print('Association rejected, aborted or never connected')
