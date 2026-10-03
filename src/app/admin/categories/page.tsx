import type { Metadata } from "next";
import { FolderTree, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { CategoryIcon } from "@/components/course/category-icon";
import { CategoryDialog } from "@/components/admin/categories/category-dialog";
import { DeleteCategoryButton } from "@/components/admin/categories/delete-category-button";
import { pluralize } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/guards";
import { listAdminCategories } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const viewer = await requirePagePermission("category:manage", "/admin/categories");
  const categories = await listAdminCategories(viewer);
  const createButton = (
    <CategoryDialog
      trigger={
        <Button>
          <Plus aria-hidden />
          New category
        </Button>
      }
    />
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Categories"
        description={categories.length ? `${pluralize(categories.length, "category", "categories")} organizing your catalogue.` : "Group courses so people can browse by topic."}
        actions={categories.length ? createButton : undefined}
      />
      {categories.length === 0 ? (
        <EmptyState icon={<FolderTree />} title="No categories yet" description="Create topics like Discipleship, Marriage or Leadership." action={createButton} />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border">
            {categories.map((c) => (
              <li key={c.id} className="flex items-start gap-4 px-4 py-4 sm:items-center sm:px-6">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                  <CategoryIcon name={c.icon} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.name}</p>
                  {c.description && <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
                  <p className="mt-1 text-xs text-subtle-foreground">
                    {pluralize(c.courseCount, "course")}
                    {c.courseCount > 0 ? ` · ${c.publishedCount} published` : ""} · /{c.slug}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <CategoryDialog
                    category={c}
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label={`Edit ${c.name}`}>
                        <Pencil />
                      </Button>
                    }
                  />
                  <DeleteCategoryButton id={c.id} name={c.name} courseCount={c.courseCount} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
