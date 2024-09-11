from pynetdicom import AE, debug_logger
from pydicom.uid import ImplicitVRLittleEndian,CTImageStorage


# debug_logger()

# 初始化应用程序实体（AE）
ae = AE(ae_title='PYNETDICOM')

# 添加需要的呈现上下文
# 添加请求的呈现上下文（QR SCU）
ae.add_requested_context(CTImageStorage)

# 添加请求的呈现上下文（Storage SCP），并指定传输语法
# 使用add_supported_context而不是add_negotiation_item
ae.add_supported_context(CTImageStorage, transfer_syntax=[ImplicitVRLittleEndian])

# 建立与远程AE的关联
remote_ae = 'PYNETDICOM'
remote_ip = '127.0.0.1'
remote_port = 104
assoc = ae.associate(remote_ip, remote_port)

if assoc.is_established:
    # 执行 N-DELETE 操作
    #print('123')
    status = assoc.send_n_delete('1.2.840.10008.5.1.4.1.1.2', '2.16.840.1.113669.632.20.1211.10000315526')  # 替换为实际的SOP类UID和实例UID

    # 检查响应状态
    if status:
        print('N-DELETE 操作成功')
    else:
        print('N-DELETE 操作失败')

    # 释放关联
    assoc.release()
else:
    print('与 DICOM 服务器关联失败')