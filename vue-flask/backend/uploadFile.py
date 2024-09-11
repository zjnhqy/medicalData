import json
import shutil
import time
import requests
import os
from conversion import run_nii2dcm_from_python
from concurrent.futures import ThreadPoolExecutor, as_completed

ORTHANC_URL = 'http://localhost:8042'


def upload_file_to_orthanc(file):
    url = f"{ORTHANC_URL}/instances"
    files = {'file': (file.filename, file.stream, file.mimetype)}
    # print(file.filename)
    suffix = file.filename.split('.', 1)[-1]
    # print(suffix)
    save_dir = 'nii2dcm'
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)

    if suffix == 'nii.gz' or suffix == 'nii':
        # 保存文件到本地
        # print('123')
        local_filename = os.path.join('', file.filename)
        with open(local_filename, 'wb') as local_file:
            for chunk in file.stream:
                local_file.write(chunk)
        # print(f'文件已保存到本地：{local_filename}')
        # os.system('ipconfig')
        # conversion_command = f'nii2dcm {local_filename} {save_dir} -d CT'
        # #print(f'正在执行转换命令: {conversion_command}')
        # process = Popen(conversion_command, shell=True, stdout=PIPE, stderr=PIPE)
        # process.communicate()  # 等待命令执行完成

        # 改为执行python函数
        conversion_successful = run_nii2dcm_from_python(local_filename, save_dir,"CT")

        # 检查转换命令是否成功执行
        if conversion_successful :
            # print('转换成功，删除原始nii文件并开始上传dcm文件...')
            os.remove(f'{local_filename}')
            # 遍历 dicom 目录下的所有文件并上传
            dicom_dir = save_dir  # 假设输出目录结构
            files_to_upload = [os.path.join(dicom_dir, f) for f in os.listdir(dicom_dir) if
                               os.path.isfile(os.path.join(dicom_dir, f))]

            def upload_file(file_path):
                try:
                    with open(file_path, 'rb') as file_data:
                        files = {'file': (os.path.basename(file_path), file_data, 'application/dicom')}
                        response = requests.post(url, files=files)
                        response.raise_for_status()
                    return (os.path.basename(file_path), '成功')
                except Exception as e:
                    return (os.path.basename(file_path), str(e))

            # 使用线程池并发上传
            with ThreadPoolExecutor(max_workers=200) as executor:  # 可以根据系统资源调整线程数量
                future_to_file = {executor.submit(upload_file, file): file for file in files_to_upload}
                for future in as_completed(future_to_file):
                    file_name, result = future.result()
                    # print(f'文件 {file_name} 上传状态：{result}')
            # print('开始删除nii2dcm文件夹...')
            dicom_folder_path = 'nii2dcm'
            shutil.rmtree(dicom_folder_path)
            # print(f'nii2dcm文件夹 {dicom_folder_path} 已被删除。')

        else:
            print('转换失败，请检查错误信息。')
    elif suffix == 'dcm':
        response = requests.post(url, files=files)
        return response
