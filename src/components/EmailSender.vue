<template>
  <div class="email-sender">
    <el-form :model="emailForm" ref="emailFormRef" label-width="80px" class="email-form">
      <!-- Recipients Input -->
      <el-form-item label="Recipients">
        <el-input
            v-model="emailForm.recipients"
            placeholder="Enter the recipient, separated by commas"
            clearable
            @keydown.space.prevent="autoAddComma"
        ></el-input>
      </el-form-item>

      <!-- File Upload -->
      <el-form-item label="Attachments">
        <el-upload
            class="upload-demo"
            :file-list="fileList"
            :auto-upload="false"
            multiple
            :on-change="handleFileChange"
            list-type="text"
        >
          <el-button type="primary">Select Files</el-button>
        </el-upload>
      </el-form-item>

      <!-- Email Subject -->
      <el-form-item label="Subject">
        <el-input
            v-model="emailForm.title"
            placeholder="Enter subject"
            clearable
        ></el-input>
      </el-form-item>

      <!-- Email Body -->
      <el-form-item label="Body">
        <el-input
            type="textarea"
            v-model="emailForm.text"
            placeholder="Enter email body"
            :rows="10"
        ></el-input>
      </el-form-item>
    </el-form>

    <!-- Send Button -->
    <div class="action-button">
      <el-button
          type="success"
          :loading="isSending"
          :disabled="isSending"
          @click="handleSend"
      >
        {{ isSending ? "Sending..." : "Send" }}
      </el-button>
    </div>
  </div>
</template>

<script>
import {ref, reactive, onMounted} from "vue";
import {sendEmail} from "../api/email"; // Email sending API
import {uploadToS3, calculateMD5} from "../api/s3"; // S3 upload logic
import {ElMessage} from "element-plus";

export default {
  name: "EmailSender",
  setup() {
    // Dynamically set the page title
    onMounted(() => {
      document.title = "Email Sender";
    });

    // Define form object
    const emailForm = reactive({
      recipients: "", // Recipients
      title: "", // Email subject
      text: "", // Email body
      attachments: [], // Attachment file list
    });

    // Define fileList and form ref
    const fileList = ref([]);
    const emailFormRef = ref(null);
    const isSending = ref(false); // Sending state indicator

    // Handle file changes
    const handleFileChange = async (file, fileListNew) => {
      fileList.value = fileListNew;
    };

    // Automatically append a comma when pressing space
    const autoAddComma = () => {
      const trimmedRecipients = emailForm.recipients.trim();
      const lastRecipient = trimmedRecipients.split(",").pop();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lastRecipient)) {
        emailForm.recipients = `${trimmedRecipients},`;
      }
    };

    // Display message
    const showMessage = (message, type = "success") => {
      ElMessage({
        message,
        type,
        duration: 3000, // Auto-close after 3 seconds
        showClose: true, // Show close button in the top-right corner
      });
    };

    // Reset the form
    const resetForm = () => {
      emailForm.recipients = "";
      emailForm.title = "";
      emailForm.text = "";
      emailForm.attachments = [];
      fileList.value = []; // Clear file list
    };

    // Handle email sending
    const handleSend = async () => {
      // Clean up recipients by removing trailing commas
      emailForm.recipients = emailForm.recipients.trim().replace(/,+$/, "");

      // Validate recipients field
      if (!emailForm.recipients.trim()) {
        showMessage("Recipients cannot be empty!", "warning");
        return;
      }

      // Validate email addresses
      const recipientsArray = emailForm.recipients.split(",");
      const invalidRecipients = recipientsArray.filter(
          (email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      );

      if (invalidRecipients.length > 0) {
        showMessage(`Invalid recipient(s): ${invalidRecipients.join(", ")}`, "error");
        return;
      }

      if (!emailForm.title.trim()) {
        showMessage("Subject cannot be empty!", "warning");
        return;
      }

      if (!emailForm.text.trim()) {
        showMessage("Body cannot be empty!", "warning");
        return;
      }

      isSending.value = true; // Set sending state to true

      // Upload attachments and retrieve file MD5 hashes
      const attachmentPromises = fileList.value.map(async (file) => {
        const fileMD5 = await calculateMD5(file.raw); // Compute file MD5
        const fileKey = `${fileMD5}`; // Use MD5 as the filename
        const originalFilename = file.name; // Get original filename
        // Upload file to S3
        await uploadToS3(file.raw, fileKey);
        return {filename: fileMD5, originalFilename}; // Store MD5 and original filename
      });

      try {
        // Wait for all attachments to be uploaded
        emailForm.attachments = await Promise.all(attachmentPromises);

        // Call the email sending API
        const response = await sendEmail({...emailForm});

        showMessage(response.response, "success");
        console.log("API Response:", response);

        // Reset the form
        resetForm();
      } catch (error) {
        showMessage(error, "error");
        console.error("Error sending email:", error);
      } finally {
        isSending.value = false; // Reset sending state
      }
    };

    return {
      emailForm,
      fileList,
      emailFormRef,
      isSending,
      handleFileChange,
      handleSend,
      autoAddComma,
    };
  },
};
</script>

<style scoped>
.email-sender {
  max-width: 100%;
  margin: 20px auto;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.email-form {
  margin-bottom: 20px;
}

.action-button {
  text-align: right;
}
</style>
