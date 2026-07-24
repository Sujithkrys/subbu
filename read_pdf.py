import sys
import PyPDF2

def read_pdf(file_path):
    try:
        with open(file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            text = ""
            for page in reader.pages:
                text += page.extract_text()
            with open('fonts_readme.txt', 'w', encoding='utf-8') as out_f:
                out_f.write(text)
            print("Successfully extracted to fonts_readme.txt")
    except Exception as e:
        print(f"Error reading PDF: {e}")

read_pdf(r"C:\Users\LENOVO\Downloads\Sparvol_-_Caption_Fx_Pack\Read Me For Fonts.pdf")
