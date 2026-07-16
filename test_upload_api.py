import os
import sys
import requests

def main():
    # 1. API endpoint va Lesson ID ni sozlang
    lesson_id = input("Tekshirmoqchi bo'lgan Lesson (dars) ID raqamini kiriting: ").strip()
    if not lesson_id:
        print("Lesson ID kiritilmadi!")
        return

    url = f"http://127.0.0.1:8000/api/lessons/{lesson_id}/upload-video/"

    # 2. Test video fayl yo'lini kiriting
    video_path = input("Yuklamoqchi bo'lgan test video fayli yo'lini kiriting (masalan: test.mp4): ").strip()
    if not video_path or not os.path.exists(video_path):
        print(f"Fayl topilmadi: {video_path}")
        return

    # 3. Request yuborish
    print(f"So'rov yuborilmoqda: {url}...")
    files = {
        'video_file': (os.path.basename(video_path), open(video_path, 'rb'), 'video/mp4')
    }
    data = {
        'title': 'Test Lesson Video',
        'description': 'This is a test upload to YouTube from Django backend.'
    }

    try:
        response = requests.post(url, files=files, data=data)
        print("\n=== SERVER JAVOBI ===")
        print(f"Status Code: {response.status_code}")
        try:
            print("Response JSON:", response.json())
        except Exception:
            print("Response Text:", response.text)
    except requests.exceptions.ConnectionError:
        print("Xatolik: Django server ishga tushmagan! Oldin 'python manage.py runserver' ni yoqing.")
    except Exception as e:
        print(f"Kutilmagan xatolik: {str(e)}")

if __name__ == '__main__':
    main()
