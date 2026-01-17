import axios from "axios";

const BASE_URL = "http://localhost:5000/api/notifications"; // ✅ apne backend port ke hisab se

export const getMyNotifications = (token) => {
  return axios.get(`${BASE_URL}/my?page=1&limit=10`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getUnreadCount = (token) => {
  return axios.get(`${BASE_URL}/unread-count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const markAllRead = (token) => {
  return axios.put(
    `${BASE_URL}/read-all`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const markOneRead = (token, id) => {
  return axios.put(
    `${BASE_URL}/read/${id}`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const deleteOneNotification = (token, id) => {
  return axios.delete(`${BASE_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
