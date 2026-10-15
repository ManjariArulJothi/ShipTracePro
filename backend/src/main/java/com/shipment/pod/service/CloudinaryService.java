package com.shipment.pod.service;



import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    @Value("${cloudinary.api-key:demo}")
    private String apiKey;

    public String uploadImage(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }

        if ("demo".equalsIgnoreCase(apiKey)) {
            log.info("Cloudinary api-key is 'demo', storing image as data URL fallback.");
            return toDataUrl(file);
        }

        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.emptyMap()
            );
            return result.get("secure_url").toString();
        } catch (Exception e) {
            log.warn("Cloudinary upload failed ({}), falling back to data URL.", e.getMessage());
            return toDataUrl(file);
        }
    }

    private String toDataUrl(MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = "image/jpeg";
        }
        return "data:" + contentType + ";base64," + Base64.getEncoder().encodeToString(file.getBytes());
    }
}
