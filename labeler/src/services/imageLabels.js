import axios from 'axios';

const baseUrl = 'http://localhost:8000/api';

const uploadMetadata = async (username, imageFolder, bearerToken) => {
  const metadata = { username, image_folder: imageFolder };
  const config = {
    headers: { Authorization: bearerToken }
  };
  const response = await axios.post(
        `${baseUrl}/images`,
        metadata,
        config
  );
  console.log('Response is', response, config);
  return response.data;
};

const uploadImage = async (file, username, imageFolder, bearerToken, onUploadProgress) => {
  const metadata = { username, image_folder: imageFolder };
  const formData = new FormData();
  const meta = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
  formData.append('metadata', meta);
  // formData.append('file', new Blob([file], { type: file.type }), file.name);
  formData.append('image', file);
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: bearerToken
    },
    onUploadProgress
  };
  const response = await axios.post(`${baseUrl}/image`, formData, config);
  return response.data;
};

const getImageFolders = async (username, bearerToken) => {
  const config = {
    headers: { Authorization: bearerToken }
  };
  const response = await axios.get(
        `${baseUrl}/image_folders?username=${username}`,
        config
  );
  console.log('Response for getImageFolders is:', response);
  return response.data;
};

const getImages = async (username, imageFolder, bearerToken) => {
  const config = {
    headers: { Authorization: bearerToken }
  };
  const response = await axios.get(
        `${baseUrl}/images?username=${username}&image_folder=${imageFolder}`,
        config
  );
  console.log('Response for getImages is:', response);
  return response.data;
};

const getImage = async (username, imageFolder, imageId, bearerToken) => {
  const config = {
    responseType: 'blob',
    headers: { Authorization: bearerToken }
  };
  const response = await axios.get(
        `${baseUrl}/images/${imageId}?username=${username}&image_folder=${imageFolder}`,
        config
  );
  return response.data;
};

const getExistingBboxes = async (username, imageFolder, imageId, bearerToken) => {
  const config = {
    headers: { Authorization: bearerToken }
  };
  const response = await axios.get(
        `${baseUrl}/images/bbox/${imageId}?username=${username}&image_folder=${imageFolder}`,
        config
  );

  console.log('Response for getExistingBboxes is', response);
  return response.data;
};

const updateBboxes = async (username, imageFolder, imageId, bboxes, bearerToken) => {
  const config = {
    headers: { Authorization: bearerToken }
  };
  const data = {
    image_id: imageId,
    bboxes: bboxes.map(bbox => Object.values(bbox))
  };
  const response = await axios.post(
        `${baseUrl}/images/bbox/${imageId}?username=${username}&image_folder=${imageFolder}`,
        data,
        config
  );
  console.log('Response for updateBboxes is', response);
  return response.data;
};

export default { uploadMetadata, uploadImage, getImageFolders, getImages, getImage, updateBboxes, getExistingBboxes };
