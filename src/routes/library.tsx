import { createFileRoute } from "@tanstack/react-router";
import { RoleScreen } from "@/rafa/RoleScreen";
import { LibraryApp } from "@/rafa/apps/LibraryApp";

export const Route = createFileRoute("/library")({
  component: () => <RoleScreen role="customer"><LibraryApp /></RoleScreen>,
  head: () => ({
    meta: [
      { title: "مكتبة RAVA الرقمية — روايات وقصص وكتب تعليمية" },
      { name: "description", content: "تصفح مكتبة RAVA الرقمية: روايات، قصص، كتب دينية وتعليمية، ملخصات، كتب أطفال، تاريخ وعلوم — متاحة في كل المحافظات." },
      { property: "og:title", content: "مكتبة RAVA الرقمية" },
      { property: "og:description", content: "كل أقسام الكتب وعدد الكتب في كل قسم داخل مكتبة RAVA الرقمية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
