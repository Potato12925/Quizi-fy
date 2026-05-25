import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * [BYPASS MODE] ProtectedRoute tạm thời cho phép truy cập mọi trang không cần login
 */
export default function ProtectedRoute({ allowedRoles }: { allowedRoles: any[] }) {
  // Tạm thời bỏ qua mọi kiểm tra đăng nhập để xem giao diện
  console.log('Bypassing ProtectedRoute for roles:', allowedRoles);
  return <Outlet />;
}
