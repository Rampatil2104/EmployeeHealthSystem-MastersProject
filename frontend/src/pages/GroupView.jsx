import { useState } from "react";
import FilterDropdown from "../components/FilterDropdown";

import GroupStressWLB from "../charts/group/GroupStressWLB";
import DeptRiskSankey from "../charts/group/DeptRiskSankey";
import AttritionByDeptTenure from "../charts/group/AttritionByDeptTenure";
import GenderRiskByDept from "../charts/group/GenderRiskByDept";
import DeptWellnessRadar from "../charts/group/DeptWellnessRadar";
import EducationHealthBox from "../charts/group/EducationHealthBox";

const DEPT_OPTIONS = [
  "All",
  "Research & Development",
  "Sales",
  "Human Resources",
  "IT",
  "Operations",
  "Marketing",
  "Finance",
  "Security",
  "Product",
  "Facilities",
  "Procurement",
  "Legal",
  "Customer Support",
  "Data Science",
  "Design",
].map((d) => ({ label: d, value: d }));

const RISK_OPTIONS = ["All", "Low", "Medium", "High"].map((r) => ({ label: r, value: r }));

export default function GroupView() {
  const [department, setDepartment] = useState("All");
  const [risk, setRisk] = useState("All");

  return (
    <div className="space-y-6 px-6 py-6">
      <div className="flex gap-4 items-center">
        <FilterDropdown label="Department" value={department} onChange={setDepartment} options={DEPT_OPTIONS} />
        <FilterDropdown label="Risk" value={risk} onChange={setRisk} options={RISK_OPTIONS} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GroupStressWLB department={department} risk={risk} />
        <DeptRiskSankey />

        <AttritionByDeptTenure />
        <GenderRiskByDept />

        <DeptWellnessRadar department={department} />
        <EducationHealthBox />
      </div>
    </div>
  );
}
