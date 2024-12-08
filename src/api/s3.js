import {S3Client, PutObjectCommand} from "@aws-sdk/client-s3";
import CryptoJS from "crypto-js"; // 使用 crypto-js 处理 MD5

// 初始化 S3 客户端
const s3Client = new S3Client({
    region: "us-east-1", // 使用标准 AWS 区域
    endpoint: "http://192.168.52.128:9000", // MinIO 服务地址
    credentials: {
        accessKeyId: "adminadmin", // MinIO 用户名
        secretAccessKey: "adminadmin", // MinIO 密码
    },
    forcePathStyle: true, // 强制使用路径风格访问
});

/**
 * 上传文件到 S3（MinIO）
 * @param {File} file 文件对象
 * @param {string} fileKey 文件键名
 * @returns {Promise<string>} 上传成功后返回文件 URL
 */
export const uploadToS3 = async (file, fileKey) => {
    const command = new PutObjectCommand({
        Bucket: "email-attachment-file", // 存储桶名称
        Key: fileKey,
        Body: file, // 这里是文件对象，而不是普通对象
        ContentType: file.type, // 文件类型
    });

    try {
        await s3Client.send(command);
        return `http://localhost:9000/email-attachment-file/${fileKey}`;
    } catch (error) {
        console.error("文件上传失败:", error);
        throw error;
    }
};

/**
 * 计算文件的 MD5 哈希值
 * @param {File} file 文件对象
 * @returns {Promise<string>} 文件的 MD5 哈希值
 */
export const calculateMD5 = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
    return CryptoJS.MD5(wordArray).toString();
};
