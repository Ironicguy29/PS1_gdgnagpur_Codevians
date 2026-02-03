import { Button } from "@/components/ui/button";
import { User, Plus, FileText, ChevronRight } from "lucide-react";

const FAMILY_MEMBERS = [
    { id: 1, name: "Suman Devi", relation: "Mother", age: 62, lastCheckup: "12 Jan" },
    { id: 2, name: "Rahul Kumar", relation: "Son", age: 12, lastCheckup: "Status OK" },
    { id: 3, name: "Priya", relation: "Spouse", age: 34, lastCheckup: "Pending" },
];

export function FamilyMemberCard() {
    return (
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl h-full flex flex-col relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="text-lg font-bold">Family Records</h3>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white">
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1 relative z-10">
                {FAMILY_MEMBERS.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/5 cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                                {member.name[0]}
                            </div>
                            <div>
                                <p className="font-medium text-sm">{member.name}</p>
                                <p className="text-xs text-indigo-100">{member.relation} • {member.age} yrs</p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 relative z-10">
                <div className="flex items-center justify-between text-xs text-indigo-100">
                    <span>Linked ABHA IDs: 3</span>
                    <span className="flex items-center gap-1 cursor-pointer hover:text-white"><FileText className="w-3 h-3" /> View Reports</span>
                </div>
            </div>
        </div>
    );
}
