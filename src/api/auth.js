import CryptoJS from 'crypto-js';
import { api } from './client';

export function sha256(value) {
    return CryptoJS.SHA256(value).toString(CryptoJS.enc.Hex);
}

export function authenticate(email, password) {
    const hashedPassword = sha256(password);
    return api.post('/Authentication/authenticate', {
        emailId: email,
        password: hashedPassword,
    });
}

export function verifyMobile(id, otp) {
    return api.post('/UserRegistration/verify/mobile', { id, otp });
}

export function resendMobileOtp(id) {
    return api.post('/UserRegistration/otp/resend/mobile', { id });
}

export function getUserTypes() {
    return api.get('/Common/commonlist/userType');
}

export function getStates() {
    return api.get('/Common/getstate/2');
}

export function getCities(stateId) {
    return api.get(`/Common/getcity/${stateId}`);
}

export function getRootServices() {
    return api.get('/ServiceMaster/rootservice');
}

export function saveRegistration(payload) {
    return api.post('/UserRegistration/save', payload);
}

export function verifyEmail(id, otp) {
    return api.post('/UserRegistration/verify/email', { id, otp });
}

export function resendEmailOtp(id) {
    return api.post('/UserRegistration/otp/resend/email', { id });
}

export function setRegistrationPassword(id, password) {
    return api.post('/UserRegistration/userpassword', { id, password: sha256(password) });
}