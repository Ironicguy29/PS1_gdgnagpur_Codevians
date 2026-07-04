import re
//import
file_path = "/home/vinman/arogyamitra/ArogyaMitra/frontend/src/app/auth/[role]/register/page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace input styles
content = content.replace(
    'className="h-12 bg-slate-950 border-slate-800 rounded-xl"',
    'className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"'
)

content = content.replace(
    'className="h-12 bg-slate-900 border-slate-800 rounded-xl text-slate-400"',
    'className="h-12 bg-slate-100 dark:bg-slate-900 border-slate-250 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-400"'
)

# Replace select styles
content = content.replace(
    'className="h-12 w-full px-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"',
    'className="h-12 w-full px-3 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"'
)

# Replace container styles
content = content.replace(
    'className="space-y-6 w-full max-w-xl mx-auto text-slate-100"',
    'className="space-y-6 w-full max-w-xl mx-auto text-slate-850 dark:text-slate-100"'
)

# Replace emergency contact section and government identifiers headings if needed
content = content.replace(
    'className="text-sm font-bold text-slate-300 uppercase tracking-wider"',
    'className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"'
)

content = content.replace(
    'className="border-b border-slate-800 pb-2 mb-2"',
    'className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-2"'
)

content = content.replace(
    'className="border-b border-slate-800 pb-2 pt-2 mb-2"',
    'className="border-b border-slate-200 dark:border-slate-800 pb-2 pt-2 mb-2"'
)

content = content.replace(
    'className="bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-100 h-12 px-4 rounded-xl flex items-center justify-center"',
    'className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 h-12 px-4 rounded-xl flex items-center justify-center"'
)

content = content.replace(
    'className="bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl h-12 px-4 whitespace-nowrap"',
    'className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl h-12 px-4 whitespace-nowrap"'
)

content = content.replace(
    'className="flex items-center gap-2 text-emerald-500 font-semibold bg-emerald-950/20 border border-emerald-800/30 rounded-xl p-3 text-sm"',
    'className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 font-semibold bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl p-3 text-sm"'
)

content = content.replace(
    'className="h-12 rounded-xl bg-red-950/20 border-red-900/40 text-red-100 focus:ring-red-500"',
    'className="h-12 rounded-xl bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-900 dark:text-red-100 focus:ring-red-500"'
)

content = content.replace(
    'className="text-slate-300 flex items-center gap-2"',
    'className="text-slate-800 dark:text-slate-300 flex items-center gap-2"'
)

content = content.replace(
    'className="border-t border-slate-800 pt-4 mt-4 space-y-4"',
    'className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4 space-y-4"'
)

content = content.replace(
    'className="flex gap-4 pt-4 border-t border-slate-800/40"',
    'className="flex gap-4 pt-4 border-t border-slate-200 dark:border-slate-800/40"'
)

# Step indicators bg-emerald-950 border-emerald-700 text-emerald-300
content = content.replace(
    "step > num \n                                        ? 'bg-emerald-950 border-emerald-700 text-emerald-300' \n                                        : 'bg-slate-900 border-slate-800 text-slate-500'",
    "step > num \n                                        ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300' \n                                        : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'"
)

# Also let's handle single line version of the step indicators condition just in case of whitespace difference
content = content.replace(
    "step > num ? 'bg-emerald-950 border-emerald-700 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'",
    "step > num ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'"
)

# Also the line connector: step > num ? 'bg-emerald-700' : 'bg-slate-800'
content = content.replace(
    "step > num ? 'bg-emerald-700' : 'bg-slate-800'",
    "step > num ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'"
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully replaced input styles in register page.")
