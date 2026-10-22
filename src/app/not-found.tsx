import Link from "next/link";
import { Empty } from "@/components/ui";

export default function NotFound() {
  return (
    <Empty icon="search" title="Seite nicht gefunden" action={<Link className="btn btn-line btn-s" href="/">Zur Übersicht</Link>}>
      Diese Adresse gibt es im Portal nicht.
    </Empty>
  );
}
