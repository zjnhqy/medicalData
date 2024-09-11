# """
# nii2dcm entrypoint code and command line interface (CLI)
# """
#
# import sys
# import argparse
# from pathlib import Path
# from nii2dcm.run import run_nii2dcm
#
#
# def cli(args=None):
#     """
#     Run nii2dcm via command line
#     """
#     if args is None:
#         args = sys.argv[1:]
#
#     parser = argparse.ArgumentParser(
#         prog="nii2dcm",
#         description="nii2dcm - NIfTI file to DICOM conversion"
#     )
#
#     parser.add_argument("input_file", type=str, help="[.nii/.nii.gz] input NIfTI file")
#     parser.add_argument("output_dir", type=str, help="[directory] output DICOM path")
#     parser.add_argument("-d", "--dicom_type", type=str, help="[string] type of DICOM. e.g. MR, CT, US, XR, etc.")
#     parser.add_argument("-r", "--ref_dicom", type=str, help="[.dcm] Reference DICOM file for Attribute transfer")
#     parser.add_argument("-v", "--version", action="version", version="0.1.0")
#
#     args = parser.parse_args()
#
#     input_file = Path(args.input_file)  # TODO: add check that file is .nii/.nii.gz
#     output_dir = Path(args.output_dir)  # TODO: add check that this is directory
#
#     if not input_file.exists():
#         print(f"Input file '{input_file}' not found")
#         raise SystemExit(1)
#
#     if not output_dir.exists():
#         print(f"Output directory '{output_dir}' does not exist")
#         raise SystemExit(1)
#
#     # Coding of optional file checks below is quite verbose
#     if args.dicom_type is not None:
#         dicom_type = args.dicom_type  # TODO: add check that supplied dicom_type is permitted
#     elif args.dicom_type is None:
#         dicom_type = None
#
#     if args.ref_dicom is not None:
#         ref_dicom_file = Path(args.ref_dicom)   # TODO: add check that file is DICOM
#     elif args.ref_dicom is None:
#         ref_dicom_file = None
#
#     # execute nii2dcm
#     run_nii2dcm(
#         input_file,
#         output_dir,
#         dicom_type,
#         ref_dicom_file
#     )
#
#
# if __name__ == "__main__":
#     sys.exit(cli())
import sys
from pathlib import Path
from nii2dcm.run import run_nii2dcm


def run_nii2dcm_from_python(input_file, output_dir, dicom_type=None, ref_dicom=None):
    """
    Run nii2dcm via Python function call
    """
    input_file = Path(input_file)  # Ensure input_file is a Path object
    output_dir = Path(output_dir)  # Ensure output_dir is a Path object

    if not input_file.exists():
        print(f"Input file '{input_file}' not found")
        raise SystemExit(1)

    if not output_dir.exists():
        print(f"Output directory '{output_dir}' does not exist")
        raise SystemExit(1)

    if ref_dicom is not None:
        ref_dicom_file = Path(ref_dicom)  # Ensure ref_dicom_file is a Path object
        if not ref_dicom_file.exists():
            print(f"Reference DICOM file '{ref_dicom_file}' not found")
            raise SystemExit(1)

    # Execute nii2dcm
    run_nii2dcm(
        input_file,
        output_dir,
        dicom_type,
        ref_dicom_file if ref_dicom else None
    )
    return True

# Example usage:
# if __name__ == "__main__":
#     # Replace these with the actual arguments you want to use
#     input_file_path = "path/to/your/input.nii"
#     output_directory_path = "path/to/your/output"
#     dicom_type = "MR"  # or any other DICOM type you need
#     ref_dicom_path = "path/to/your/reference.dcm"  # if you have one
#
#     # Call the function with the arguments
#     run_nii2dcm_from_python(input_file_path, output_directory_path, dicom_type, ref_dicom_path)

# input_file_path = "00_gt.nii.gz"
# output_directory_path = "dicom"
# dicom_type = "CT"  # or any other DICOM type you need
# ref_dicom_path = ""  # if you have one
#
# # Call the function with the arguments
# run_nii2dcm_from_python(input_file_path, output_directory_path, dicom_type, ref_dicom_path)
