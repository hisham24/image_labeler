import axios from 'axios';

const baseUrl = 'http://localhost:8000';

const signUpUser = async (username, password) => {
  const userDetails = { username, password };
  const response = await axios.post(`${baseUrl}/signup`, userDetails);
  console.log('Response is', response);
  return response.data;
};

const loginUser = async (username, password) => {
  console.log('Login attempt');
  const userDetails = { username, password };
  const response = await axios.post(`${baseUrl}/login`, userDetails);
  console.log('Response is', response);
  return response.data;
};

export default { signUpUser, loginUser };
