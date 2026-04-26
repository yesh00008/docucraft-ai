import json
import subprocess
import os

files = [
    ".trae/documents/prd.md", "README.md", "eslint.config.js", "index.html",
    "package-lock.json", "package.json", "postcss.config.js", "public/favicon.svg",
    "src/App.tsx", "src/assets/react.svg", "src/components/ChatPanel.tsx",
    "src/components/DocumentEditor.tsx", "src/components/ExportButton.tsx",
    "src/components/NavLink.tsx", "src/components/ThemeSwitcher.tsx",
    "src/components/Workspace.tsx", "src/components/ui/accordion.tsx",
    "src/components/ui/alert-dialog.tsx", "src/components/ui/alert.tsx",
    "src/components/ui/aspect-ratio.tsx", "src/components/ui/avatar.tsx",
    "src/components/ui/badge.tsx", "src/components/ui/breadcrumb.tsx",
    "src/components/ui/button.tsx", "src/components/ui/calendar.tsx",
    "src/components/ui/card.tsx", "src/components/ui/carousel.tsx",
    "src/components/ui/chart.tsx", "src/components/ui/checkbox.tsx",
    "src/components/ui/collapsible.tsx", "src/components/ui/command.tsx",
    "src/components/ui/context-menu.tsx", "src/components/ui/dialog.tsx",
    "src/components/ui/drawer.tsx", "src/components/ui/dropdown-menu.tsx",
    "src/components/ui/form.tsx", "src/components/ui/hover-card.tsx",
    "src/components/ui/input-otp.tsx", "src/components/ui/input.tsx",
    "src/components/ui/label.tsx", "src/components/ui/menubar.tsx",
    "src/components/ui/navigation-menu.tsx", "src/components/ui/pagination.tsx",
    "src/components/ui/popover.tsx", "src/components/ui/progress.tsx",
    "src/components/ui/radio-group.tsx", "src/components/ui/resizable.tsx",
    "src/components/ui/scroll-area.tsx", "src/components/ui/select.tsx",
    "src/components/ui/separator.tsx", "src/components/ui/sheet.tsx",
    "src/components/ui/sidebar.tsx", "src/components/ui/skeleton.tsx",
    "src/components/ui/slider.tsx", "src/components/ui/sonner.tsx",
    "src/components/ui/switch.tsx", "src/components/ui/table.tsx",
    "src/components/ui/tabs.tsx", "src/components/ui/textarea.tsx",
    "src/components/ui/toast.tsx", "src/components/ui/toaster.tsx",
    "src/components/ui/toggle-group.tsx", "src/components/ui/toggle.tsx",
    "src/components/ui/tooltip.tsx", "src/components/ui/use-toast.ts",
    "src/hooks/use-mobile.tsx", "src/hooks/use-toast.ts", "src/index.css",
    "src/integrations/supabase/client.ts", "src/integrations/supabase/types.ts",
    "src/lib/documentExport.ts", "src/lib/documentThemes.ts", "src/lib/longform.ts",
    "src/lib/parseDocument.ts", "src/lib/slidesExport.ts", "src/lib/streamChat.ts",
    "src/lib/utils.ts", "src/main.tsx", "src/pages/Index.tsx", "src/pages/NotFound.tsx",
    "src/store/useAppStore.ts", "src/test/example.test.ts", "src/test/setup.ts",
    "src/utils/generationEngine.ts", "src/utils/pptxExport.ts", "tailwind.config.js",
    "tsconfig.json", "vite.config.ts"
]

out = []
for f in files:
    try:
        diff = subprocess.check_output(['git', '--no-pager', 'diff', 'origin/main...trae/solo-agent-UgLbfI', '--', f], text=True)
        # Check if file was added or deleted
        status = subprocess.check_output(['git', '--no-pager', 'diff', '--name-status', 'origin/main...trae/solo-agent-UgLbfI', '--', f], text=True).strip()
        if status.startswith('A'):
            out.append(f"{f}: Added new file.")
        elif status.startswith('D'):
            out.append(f"{f}: Deleted file.")
        else:
            out.append(f"{f}: Modified file.")
    except Exception as e:
        out.append(f"{f}: Error {e}")

with open('file_summary.txt', 'w') as f:
    f.write("\n".join(out))
