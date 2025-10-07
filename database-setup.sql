-- Database Schema for LawHub Application

-- User Profiles Table
CREATE TABLE user_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    phone VARCHAR(20),
    city VARCHAR(100),
    status ENUM('student', 'employee', 'professional', 'other'),
    college_name VARCHAR(255),
    course VARCHAR(255),
    company_name VARCHAR(255),
    designation VARCHAR(255),
    learning_goal ENUM('exam-prep', 'career-change', 'professional-dev', 'general-knowledge', 'specific-area'),
    interests JSON,
    profile_picture_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_email (user_id, email),
    INDEX idx_user_id (user_id),
    INDEX idx_email (email)
);

-- User Login Activity Table
CREATE TABLE user_login_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type ENUM('desktop', 'mobile', 'tablet') DEFAULT 'desktop',
    browser VARCHAR(100),
    location_country VARCHAR(100),
    location_city VARCHAR(100),
    session_duration INT DEFAULT 0, -- in minutes
    logout_time TIMESTAMP NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_email (email),
    INDEX idx_login_time (login_time)
);

-- User Activity Logs Table (for dashboard actions)
CREATE TABLE user_activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    activity_type VARCHAR(100) NOT NULL, -- 'profile_update', 'course_enroll', 'search', 'chat', etc.
    activity_description TEXT,
    activity_data JSON, -- additional structured data
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    INDEX idx_user_id (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_timestamp (timestamp)
);

-- Sample data for testing
INSERT INTO user_profiles (user_id, email, first_name, last_name, city, status, learning_goal) 
VALUES (1, 'ashika@example.com', 'Ashika', 'Fathima', 'Mumbai', 'student', 'exam-prep');