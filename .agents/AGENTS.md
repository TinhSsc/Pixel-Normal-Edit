# Project Rules for Pixel Normal Edit

This file contains custom behavior and constraints for AI agents working on this workspace.

## Core Rules

1. **Disable Impeccable Live Mode**: Do not use the `impeccable` live mode or suggest running it. The project handles its own React state and styling and live mode causes unexpected issues with the canvas logic.
2. **Background Image Restrictions**: Do NOT allow AI-generated images to be set directly as the canvas background. Ensure that any `set-background` logic verifies that the image source is a user-uploaded image, not an AI generation block.
3. **Vietnamese Language Support**: The project uses Vietnamese as the primary language (configured in `src/js/lang/i18n.js`). Maintain Vietnamese translations for all user-facing UI elements, tooltips, and alerts.
4. **Legacy JS to React Integration**: Keep in mind that legacy vanilla JS logic (previously in `js/`) has been ported to interact with React components. When fixing bugs, ensure React component state stays in sync with vanilla JS canvas event listeners.

## Default AI Skills
Always assume and utilize the following skills by default when working on this project:
- **`react-patterns`** & **`ui-skills`**: For building/refactoring React components.
- **`javascript-mastery`**: For core canvas logic and vanilla JS operations.
- **`clean-code`**: To maintain SRP and project cleanliness.
- **`debugger`**: When troubleshooting Canvas-React sync issues.
- **`check-syntax`**: Tự động kiểm tra và sửa lỗi cú pháp sau khi viết hoặc sửa code.
- **`sync-i18n`**: Tự động đồng bộ và kiểm tra key đa ngôn ngữ mỗi khi có cập nhật giao diện.
- **`redesign`**: Dành cho các tác vụ thay đổi, thiết kế lại giao diện (redesign).
