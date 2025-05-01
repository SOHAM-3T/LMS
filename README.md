# 📚 Project LMS - Learning Management System

A modern Learning Management System (LMS) built with Django backend and React frontend, featuring role-based access control, real-time quiz performance tracking, and a beautiful UI powered by Tailwind CSS.

---

## 📌 Features

### Authentication & Access Control
- ✅ JWT-based authentication system
- ✅ Role-based access (Student & Faculty)
- ✅ Secure email verification
- ✅ Protected API endpoints

### Faculty Dashboard
- ✅ Quiz Management
  -✅ Create and edit quizzes
  - ✅Set quiz parameters (difficulty, topic, course)
  - ✅Upload and manage question bank
  - ✅Generate randomized question sets
- ✅ Performance Tracking
  - ✅View class-wide performance metrics
  - ✅Track individual student progress
  - ✅Monitor quiz completion rates
  - ✅Analyze score distributions
- ✅ Grading System
  - ✅Grade quiz responses
  - ✅Provide feedback
  - ✅Update scores in real-time

### Student Dashboard
- ✅ Quiz Interface
  - ✅Take assigned quizzes
  - ✅Submit answers
  - ✅View completion status
- ✅ Performance Analytics
  - ✅Real-time score updates
  - ✅Individual quiz performance
  - ✅Ranking in class
  - ✅Percentile standing
  - ✅Progress tracking per quiz

### Modern UI/UX
- ✅ Responsive Design
  - ✅Clean, modern interface
  - Mobile-friendly layouts
  - ✅Interactive components
- ✅ Real-time Updates
  - ✅Live performance metrics
  - ✅Dynamic progress bars
  - Instant feedback
- ✅ User Experience
  - ✅Intuitive navigation
  - ✅Clear performance visualization
  - ✅Accessible interface

---

## 🛠 Tech Stack

### Backend
- **Framework:** Django & Django REST Framework
- **Database:** PostgreSQL
- **Authentication:** JWT (SimpleJWT)
- **Security:** CORS, Email verification
- **API:** RESTful endpoints

### Frontend
- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide
- **Routing:** React Router
- **State Management:** React Hooks

### Development
- VSCode
- pgAdmin
- Postman
- Git

---

## 🚀 Setup Instructions

### Backend Setup
```bash
# Clone the repository
git clone <repository-url>
cd project-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your settings

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### Frontend Setup
```bash
# Clone the repository
git clone <repository-url>
cd project-frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start development server
npm run dev
```

---

## 🔐 Environment Configuration

### Backend (.env)
```env
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Email Configuration
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## 📈 Future Enhancements

- 📷 AI-based proctoring system
- 📊 Advanced analytics dashboard
- 📱 Mobile application
- 🔐 OAuth integration
- 📎 Export results to PDF/Excel
- ⏰ Timed quiz sessions
- 📝 Rich text question editor
- 🎯 Adaptive difficulty
- 🔄 Quiz retake functionality
- 📈 Learning path tracking

---

## ✉️ Contact

**Soham Tripathy**  
NIT Andhra Pradesh, CSE  
- GitHub: [@SOHAM-3T](https://github.com/SOHAM-3T)  
- Email: [soham4net@gmail.com](mailto:soham4net@gmail.com)  
- LinkedIn: [linkedin.com/in/sohamtripathy/](https://www.linkedin.com/in/sohamtripathy/) 

## ✉️Contributers
**Lohith Krishna**
NIT Andhra Pradesh, CSE 
- GitHub: [@lohithkrishna12](https://github.com/lohithkrishna12)  
- Email: [423166@student.nitandhra.ac.in](mailto:423166@student.nitandhra.ac.in)  
---

**Built with passion for education and technology 🚀**

