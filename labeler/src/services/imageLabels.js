import axios from 'axios';

const baseUrl = 'http://localhost:8000';

const uploadMetadata = async () => {
    const metadata = { 'username': 'reactUser', 'image_folder': 'newFolder' };
    const response = await axios.post(`${baseUrl}/images`, metadata);
    console.log('Response is', response);
    return response.data;
}

const uploadImage = async (file, onUploadProgress) => {
    const metadata = { 'username': 'reactUser', 'image_folder': 'newFolder' };
    const formData = new FormData();
    const meta = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
    formData.append('metadata', meta);
    // formData.append('file', new Blob([file], { type: file.type }), file.name);
    formData.append('image', file);
    const config = {
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        onUploadProgress,
    };
    const response = await axios.post(`${baseUrl}/image`, formData, config);
    return response.data;
}

const getImages = async (username, imageFolder) => {
    const response = await axios.get(
        `${baseUrl}/images?username=${username}&image_folder=${imageFolder}`
    );
    console.log('Response for getImages is:', response);
    return response.data;
}

const getExistingBboxes = async (image_id) => {
    const response = await axios.get(
        `${baseUrl}/images/bbox/${image_id}?username=reactUser&image_folder=newFolder`
    );

    console.log('Response for getExistingBboxes is', response);
    return response.data;
}

const updateBboxes = async (image_id, bboxes) => {
    const data = {
        image_id,
        bboxes: bboxes.map(bbox => Object.values(bbox)),
    };
    const response = await axios.post(
        `${baseUrl}/images/bbox/${image_id}?username=reactUser&image_folder=newFolder`, 
        data
    );
    console.log('Response for updateBboxes is', response);
    return response.data;
}

export default { uploadMetadata, uploadImage, getImages, updateBboxes, getExistingBboxes };