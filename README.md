# 📚 LMS Backend – Django + PostgreSQL

A powerful Learning Management System (LMS) backend built using Django and PostgreSQL, with role-based access for students and faculty, JWT authentication, quiz management, and email verification support.

---

## 📌 Features

- ✅ User authentication via JWT
- ✅ Role-based access control (Student & Faculty)
- ✅ Secure login/signup with email verification
- ✅ PostgreSQL database integration
- ✅ Faculty capabilities:
  - Upload and manage questions
  - Generate randomized quizzes
  - View student performance and results
- ✅ Student capabilities:
  - Attempt personalized quizzes
  - View quiz results
- ✅ Admin panel support for superusers

---

## 🛠 Tech Stack

- **Backend:** Django, Django REST Framework
- **Authentication:** JWT (SimpleJWT)
- **Database:** PostgreSQL
- **Email Service:** Gmail SMTP
- **Frontend:** React + Vite (in separate repo)
- **Dev Tools:** VSCode, pgAdmin, Postman

---

## 🚀 Setup Instructions

```bash
# Clone the repository
git clone https://github.com/SOHAM-3T/lms-backend.git
cd lms-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create a superuser
python manage.py createsuperuser

# Start the development server
python manage.py runserver
```

---

## 🔐 Environment Variables

Update your `.env` or add to `settings.py`:

```env
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

> Note: Enable 2-step verification and generate an App Password from your Google account.

---

## 📈 Future Scope

- 📷 AI-based webcam proctoring during quizzes
- 📊 Detailed analytics dashboard for faculty
- 📱 Mobile application (React Native or Flutter)
- 🔐 OAuth login (Google, Microsoft)
- 📎 PDF/Excel export for quiz results
- 🔌 Plugin support for external LMS tools

---

## ✉️ Contact

**Soham Tripathy**  
Student at NIT Andhra Pradesh CSE Branch  
- GitHub: [@SOHAM-3T](https://github.com/SOHAM-3T)  
- Email: [soham4net@example.com](mailto:soham4net@example.com)  
- LinkedIn: [linkedin.com/in/sohamtripathy/](https://www.linkedin.com/in/sohamtripathy/) 



**Made with ❤️ for learning and development.**

