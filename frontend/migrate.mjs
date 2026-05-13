import fs from 'fs';
import path from 'path';

const mappings = [
  { src: "d:/workspace_FE_TTCS/web_AI_tao_cau_hoi/src/app/page.tsx", dest: "d:/workspace_FE_TTCS/Quizi-fy/frontend/src/pages/Home.tsx" },
  { src: "d:/workspace_FE_TTCS/web_AI_tao_cau_hoi/src/app/(auth)/login/page.tsx", dest: "d:/workspace_FE_TTCS/Quizi-fy/frontend/src/pages/auth/Login.tsx" },
  { src: "d:/workspace_FE_TTCS/web_AI_tao_cau_hoi/src/app/(admin)/admin/dashboard/page.tsx", dest: "d:/workspace_FE_TTCS/Quizi-fy/frontend/src/pages/admin/AdminDashboard.tsx" },
  { src: "d:/workspace_FE_TTCS/web_AI_tao_cau_hoi/src/app/(admin)/admin/users/page.tsx", dest: "d:/workspace_FE_TTCS/Quizi-fy/frontend/src/pages/admin/AdminUsers.tsx" },
  { src: "d:/workspace_FE_TTCS/web_AI_tao_cau_hoi/src/app/(admin)/admin/classes/page.tsx", dest: "d:/workspace_FE_TTCS/Quizi-fy/frontend/src/pages/admin/AdminClasses.tsx" },
  { src: "d:/workspace_FE_TTCS/web_AI_tao_cau_hoi/src/app/(admin)/admin/subjects/page.tsx", dest: "d:/workspace_FE_TTCS/Quizi-fy/frontend/src/pages/admin/AdminSubjects.tsx" },
  { src: "d:/workspace_FE_TTCS/web_AI_tao_cau_hoi/src/app/(teacher)/teacher/dashboard/page.tsx", dest: "d:/workspace_FE_TTCS/Quizi-fy/frontend/src/pages/teacher/TeacherDashboard.tsx" },
  { src: "d:/workspace_FE_TTCS/web_AI_tao_cau_hoi/src/app/(teacher)/teacher/ai-generator/page.tsx", dest: "d:/workspace_FE_TTCS/Quizi-fy/frontend/src/pages/teacher/TeacherAIGenerator.tsx" },
  { src: "d:/workspace_FE_TTCS/web_AI_tao_cau_hoi/src/app/(teacher)/teacher/question-bank/page.tsx", dest: "d:/workspace_FE_TTCS/Quizi-fy/frontend/src/pages/teacher/TeacherQuestionBank.tsx" },
  { src: "d:/workspace_FE_TTCS/web_AI_tao_cau_hoi/src/app/(teacher)/teacher/resources/page.tsx", dest: "d:/workspace_FE_TTCS/Quizi-fy/frontend/src/pages/teacher/TeacherResources.tsx" },
  { src: "d:/workspace_FE_TTCS/web_AI_tao_cau_hoi/src/app/(teacher)/teacher/stats/page.tsx", dest: "d:/workspace_FE_TTCS/Quizi-fy/frontend/src/pages/teacher/TeacherStats.tsx" },
  { src: "d:/workspace_FE_TTCS/web_AI_tao_cau_hoi/src/app/(teacher)/teacher/settings/page.tsx", dest: "d:/workspace_FE_TTCS/Quizi-fy/frontend/src/pages/teacher/TeacherSettings.tsx" },
  { src: "d:/workspace_FE_TTCS/web_AI_tao_cau_hoi/src/app/(student)/student/dashboard/page.tsx", dest: "d:/workspace_FE_TTCS/Quizi-fy/frontend/src/pages/student/StudentDashboard.tsx" },
  { src: "d:/workspace_FE_TTCS/web_AI_tao_cau_hoi/src/app/(student)/student/history/page.tsx", dest: "d:/workspace_FE_TTCS/Quizi-fy/frontend/src/pages/student/StudentHistory.tsx" },
  { src: "d:/workspace_FE_TTCS/web_AI_tao_cau_hoi/src/app/(student)/student/practice/page.tsx", dest: "d:/workspace_FE_TTCS/Quizi-fy/frontend/src/pages/student/StudentPractice.tsx" },
  { src: "d:/workspace_FE_TTCS/web_AI_tao_cau_hoi/src/app/(student)/student/practice/setup/page.tsx", dest: "d:/workspace_FE_TTCS/Quizi-fy/frontend/src/pages/student/StudentPracticeSetup.tsx" },
  { src: "d:/workspace_FE_TTCS/web_AI_tao_cau_hoi/src/app/(student)/student/practice/[id]/page.tsx", dest: "d:/workspace_FE_TTCS/Quizi-fy/frontend/src/pages/student/StudentPracticeDetail.tsx" },
  { src: "d:/workspace_FE_TTCS/web_AI_tao_cau_hoi/src/app/(student)/student/progress/page.tsx", dest: "d:/workspace_FE_TTCS/Quizi-fy/frontend/src/pages/student/StudentProgress.tsx" },
  { src: "d:/workspace_FE_TTCS/web_AI_tao_cau_hoi/src/app/(student)/student/results/page.tsx", dest: "d:/workspace_FE_TTCS/Quizi-fy/frontend/src/pages/student/StudentResults.tsx" },
  { src: "d:/workspace_FE_TTCS/web_AI_tao_cau_hoi/src/app/(student)/student/results/demo/page.tsx", dest: "d:/workspace_FE_TTCS/Quizi-fy/frontend/src/pages/student/StudentResultsDemo.tsx" },
];

for (const { src, dest } of mappings) {
  if (!fs.existsSync(src)) {
    console.error(`Source not found: ${src}`);
    continue;
  }
  let content = fs.readFileSync(src, 'utf-8');

  // 1. Remove 'use client'
  content = content.replace(/['"]use client['"];?\n?/g, '');

  // 2. Remove next/image import and replace <Image with <img
  content = content.replace(/import\s+Image\s+from\s+['"]next\/image['"];?\n?/g, '');
  content = content.replace(/<Image\b/g, '<img');

  // 3. Link replacement
  content = content.replace(/import\s+Link\s+from\s+['"]next\/link['"]/g, "import { Link } from 'react-router-dom'");
  content = content.replace(/<Link([^>]*?)href=/g, '<Link$1to=');

  // 4. Navigation replacement
  content = content.replace(/import\s+\{[^}]*\}\s+from\s+['"]next\/navigation['"]/g, "import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom'");
  content = content.replace(/const\s+router\s*=\s*useRouter\(\)/g, "const navigate = useNavigate()");
  content = content.replace(/router\.push\(/g, "navigate(");
  content = content.replace(/router\.replace\(/g, "navigate(");
  content = content.replace(/router\.refresh\(\)/g, "window.location.reload()");
  content = content.replace(/const\s+pathname\s*=\s*usePathname\(\)/g, "const { pathname } = useLocation()");
  content = content.replace(/const\s+searchParams\s*=\s*useSearchParams\(\)/g, "const [searchParams] = useSearchParams()");

  // 5. Env variables
  content = content.replace(/process\.env\.NEXT_PUBLIC_/g, "import.meta.env.VITE_");

  // 6. Server components (Supabase, async function)
  content = content.replace(/export\s+default\s+async\s+function\s+(\w+)/g, "export default function $1");
  content = content.replace(/export\s+async\s+function\s+(\w+)/g, "export function $1");

  // Supabase imports
  content = content.replace(/import\s+\{\s*createClient\s*\}\s+from\s+['"]@\/utils\/supabase\/server['"]/g, "/* import { createClient } from '@/utils/supabase/server' */");
  content = content.replace(/import\s+\{\s*createClient\s*\}\s+from\s+['"]@\/utils\/supabase\/client['"]/g, "/* import { createClient } from '@/utils/supabase/client' */");
  content = content.replace(/import\s+\{\s*redirect\s*\}\s+from\s+['"]next\/navigation['"]/g, "import { Navigate } from 'react-router-dom'");

  content = content.replace(/const\s+supabase\s*=\s*await\s+createClient\(\)/g, "/* const supabase = await createClient() */");
  content = content.replace(/const\s+supabase\s*=\s*createClient\(\)/g, "/* const supabase = createClient() */");
  
  content = content.replace(/await\s+supabase/g, "({} as any)");

  content = content.replace(/redirect\((['"].*?['"])\)/g, "return <Navigate to=$1 replace />");
  content = content.replace(/await\s+params/g, "params");

  // Write to dest
  fs.writeFileSync(dest, content, 'utf-8');
  console.log(`Migrated ${path.basename(dest)}`);
}
