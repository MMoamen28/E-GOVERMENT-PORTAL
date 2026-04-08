/**
 * E-Government Portal JavaScript
 * Handles Navigation, Scroll animations, Number Counters, and Form Validation
 */

document.addEventListener('DOMContentLoaded', () => {
  // === 1. Sticky Navigation & Mobile Menu ===
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');

  // Add solid class if not on homepage (where hero image is)
  const isHomePage = document.querySelector('.hero') !== null;
  if (!isHomePage) {
    navbar.classList.add('solid');
  }

  // Scroll effect for navbar
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = navToggle.querySelector('i');
      if (navMenu.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
      } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      }
    });
  }

  // === 2. Scroll Reveal Animations ===
  const reveals = document.querySelectorAll('.reveal');

  function reveal() {
    const windowHeight = window.innerHeight;
    const elementVisible = 100;

    reveals.forEach((revealElement) => {
      const elementTop = revealElement.getBoundingClientRect().top;
      if (elementTop < windowHeight - elementVisible) {
        revealElement.classList.add('active');
      }
    });
  }

  // Initial check
  reveal();
  window.addEventListener('scroll', reveal);

  // === 3. Animated Number Counters ===
  const counters = document.querySelectorAll('.stat-number');
  let hasCounted = false;

  function startCounting() {
    if (hasCounted || counters.length === 0) return;

    const statsSection = document.getElementById('statistics');
    if (!statsSection) return;

    const sectionTop = statsSection.getBoundingClientRect().top;

    // Start counting when section is visible
    if (sectionTop < window.innerHeight - 100) {
      hasCounted = true;

      counters.forEach((counter) => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000; // 2 seconds
        const increment = target / (duration / 16); // 60fps

        let current = 0;
        const updateCounter = () => {
          current += increment;
          if (current < target) {
            counter.innerText = Math.ceil(current).toLocaleString();
            requestAnimationFrame(updateCounter);
          } else {
            counter.innerText = target.toLocaleString();
          }
        };

        updateCounter();
      });
    }
  }

  window.addEventListener('scroll', startCounting);
  startCounting(); // Check on load

  // === 4. Form Validation (Login/Contact) ===

  // Password Toggle
  const togglePassword = document.querySelector('.password-toggle');
  const passwordInput = document.getElementById('password');

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function () {
      const type =
        passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      this.classList.toggle('fa-eye');
      this.classList.toggle('fa-eye-slash');
    });
  }

  // Login Form Validation
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      let isValid = true;

      const usernameInput =
        document.getElementById('login-username') ||
        document.getElementById('nationalId');
      const passwordInput = document.getElementById('password');

      if (usernameInput.value.trim() === '') {
        setError(usernameInput, 'Username is required');
        isValid = false;
      } else {
        removeError(usernameInput);
      }

      if (passwordInput.value.length < 6) {
        setError(passwordInput, 'Password must be at least 6 characters');
        isValid = false;
      } else {
        removeError(passwordInput);
      }

      if (isValid) {
        const btn = loginForm.querySelector('.btn');
        const originalText = btn.innerHTML;
        btn.innerHTML =
          '<i class="fas fa-spinner fa-spin"></i> Authenticating...';

        try {
          const apiBase =
            window.EgovAuth &&
            typeof window.EgovAuth.getApiBaseUrl === 'function'
              ? window.EgovAuth.getApiBaseUrl()
              : 'http://localhost:3000';
          const response = await fetch(apiBase + '/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: usernameInput.value.trim(),
              password: passwordInput.value,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Authentication failed');
          }

          const data = await response.json();

          // Decode token to get roles (simplified role detection as in auth.js)
          const parts = data.access_token.split('.');
          const payload = JSON.parse(
            atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
          );

          const user = {
            sub: payload?.sub,
            username: payload?.preferred_username || usernameInput.value.trim(),
            roles: payload?.realm_access?.roles || [],
          };

          // Store token and user object using keys consistent with auth.js
          localStorage.setItem('egov_scholarship_token', data.access_token);
          localStorage.setItem('egov_scholarship_user', JSON.stringify(user));

          const redirectTarget =
            new URLSearchParams(window.location.search).get('redirect') ||
            'services.html';
          window.location.href = redirectTarget;
        } catch (error) {
          console.error('Login error:', error);
          alert('Login failed: ' + error.message);
          btn.innerHTML = originalText;
        }
      }
    });
  }

  const registerLink = document.getElementById('registerLink');
  if (
    registerLink &&
    window.EgovAuth &&
    typeof window.EgovAuth.openRegistration === 'function'
  ) {
    registerLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.EgovAuth.openRegistration();
    });
  }

  // Contact Form Validation
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let isValid =
        validateInput('fullName', 'Name is required') &
        validateEmail('email', 'Valid email is required') &
        validateInput('subject', 'Please select a subject.') &
        validateInput('message', 'Message field cannot be empty.');

      if (isValid) {
        const btn = contactForm.querySelector('.btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        setTimeout(() => {
          alert(
            'Thank you! Your message has been sent to the appropriate department. We will respond within 48 hours.',
          );
          contactForm.reset();
          btn.innerHTML = originalText;
        }, 1500);
      }
    });
  }

  function validateInput(id, errorMsg) {
    const input = document.getElementById(id);
    if (!input) return true;

    if (input.value.trim() === '') {
      setError(input, errorMsg);
      return false;
    } else {
      removeError(input);
      return true;
    }
  }

  function validateEmail(id, errorMsg) {
    const input = document.getElementById(id);
    if (!input) return true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.value.trim())) {
      setError(input, errorMsg);
      return false;
    } else {
      removeError(input);
      return true;
    }
  }

  function setError(input, message) {
    const inputGroup = input.parentElement;
    inputGroup.classList.add('error');
    const errorElement = inputGroup.querySelector('.error-message');
    if (errorElement) errorElement.innerText = message;
  }

  function removeError(input) {
    const inputGroup = input.parentElement;
    inputGroup.classList.remove('error');
  }
});
