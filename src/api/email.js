import axios from "axios";

/**
 * 发送邮件的 API
 * @param {Object} data 邮件数据
 * @returns {Promise<Object>} API 响应
 */
export const sendEmail = async (data) => {
    try {
        const response = await axios.post("/api/mail/send", data, {
            headers: {"Content-Type": "application/json"},
        });
        return response.data;
    } catch (error) {
        console.error("API Error:", error);
        throw error.response ? error.response.data : error.message;
    }
};
