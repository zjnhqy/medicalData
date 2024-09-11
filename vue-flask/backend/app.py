import shutil
import time,threading,os
from flask import Flask, request, jsonify,send_file
from flask_cors import CORS
from uploadFile import upload_file_to_orthanc
from getInformation import perform_query
from getDicomFile import  getDicomFile
from searchByName import searchByName
from searchById import searchById
from deleteFile import delete_file_from_Orthanc

app = Flask(__name__)
CORS(app,origins=['http://localhost:9999'])
app.debug = True

@app.route('/api/upload_file', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    # print(file.filename)


    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file:
        upload_file_to_orthanc(file)
        return jsonify({'msg': 'File uploaded successfully'}), 200
    else:
        return jsonify({'error': 'File not allowed'}), 400

@app.route('/api/get_uploaded_files', methods=['GET'])
def get_uploaded_files():
    try:
        results = perform_query()
        #print(results)
        return (results), 200
    except Exception as e:
        print(f"Error getting uploaded files: {e}")
        return jsonify({'error': 'Error getting uploaded files'}), 500

@app.route('/api/get_dicom_file', methods=['GET'])
def get_dicom_file():
    PatientID = request.args.get('PatientID')
    StudyInstanceUID = request.args.get('StudyInstanceUID')
    SeriesInstanceUID = request.args.get('SeriesInstanceUID')

    # 调用函数获取生成的nii.gz文件路径
    nii_gz_file_path = getDicomFile(PatientID, StudyInstanceUID, SeriesInstanceUID)
    # print(nii_gz_file_path)
    # response = send_file(zip_file_path)

    # 确保文件生成后再发送
    def remove_file_after_delay(file_path, delay):
        time.sleep(delay/100)
        try:
            os.remove(file_path)

            #print(f"File {file_path} has been removed.")
            shutil.rmtree('dcm2nii')
            #print('转换已完成，dcm2nii文件夹已删除')
        except Exception as e:
            print(f"Error removing file {file_path}: {e}")

    # 在发送文件后启动线程来删除文件
    if nii_gz_file_path:
        #print(zip_file_path)
        response = send_file(nii_gz_file_path, as_attachment=True)

        # 启动线程，在延迟后删除文件
        delete_thread = threading.Thread(target=remove_file_after_delay, args=(nii_gz_file_path,200))  # 延迟2s后删除文件
        delete_thread.start()

        return response

@app.route('/api/searchByName', methods=['GET'])
def searchFileByName():
    PatientName = request.args.get('PatientName')
    try:
        results = searchByName(PatientName)
        #print(results)
        return (results), 200
    except Exception as e:
        print(f"Error getting uploaded files: {e}")
        return jsonify({'error': 'Error getting uploaded files'}), 500

@app.route('/api/searchById', methods=['GET'])
def searchFileById():
    PatientID = request.args.get('PatientID')
    try:
        results = searchById(PatientID)
        # print(results)
        # print('1')
        return (results), 200
    except Exception as e:
        print(f"Error getting uploaded files: {e}")
        return jsonify({'error': 'Error getting uploaded files'}), 500


@app.route('/api/deleteFile')
def deleteFiles():
    file_id=request.args.get('StudyInstanceUID')
    #print(file_id)
    delete_file_from_Orthanc(file_id)
    return jsonify({'msg': 'File deleted successfully'}), 200


if __name__ == '__main__':
    app.run(debug=True)
