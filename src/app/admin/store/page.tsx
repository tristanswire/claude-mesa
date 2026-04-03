import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { StoreAdminClient } from "./StoreAdminClient";

export default async function AdminStorePage() {
  // Auth check — must be the admin user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminUserId = process.env.ADMIN_USER_ID;

  if (!user || !adminUserId || user.id !== adminUserId) {
    redirect("/recipes");
  }

  // Fetch all store items (including inactive) using service role
  const adminClient = createAdminClient();
  const { data: items, error } = await adminClient
    .from("store_items")
    .select("id, name, description, image_url, affiliate_url, category, tag, sort_order, is_active")
    .order("category")
    .order("sort_order")
    .order("name");

  if (error) {
    console.error("Error fetching store items:", error);
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Store admin</h1>
          <p className="text-sm text-gray-500 mt-1">
            {items?.length ?? 0} product{items?.length !== 1 ? "s" : ""}
          </p>
        </div>

        <StoreAdminClient items={items ?? []} />
      </div>
    </div>
  );
}
