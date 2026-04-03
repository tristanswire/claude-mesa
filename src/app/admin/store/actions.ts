"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

export async function addStoreItem(formData: FormData) {
  const supabase = createAdminClient();

  const name = formData.get("name") as string;
  const image_url = (formData.get("image_url") as string) || null;
  const affiliate_url = formData.get("affiliate_url") as string;
  const category = formData.get("category") as string;
  const tag = (formData.get("tag") as string) || null;
  const sort_order = parseInt(formData.get("sort_order") as string, 10) || 0;
  const description = (formData.get("description") as string) || null;

  if (!name || !affiliate_url || !category) {
    throw new Error("Name, affiliate URL, and category are required");
  }

  const { error } = await supabase.from("store_items").insert({
    name,
    image_url,
    affiliate_url,
    category,
    tag,
    sort_order,
    description,
    is_active: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/store");
}

export async function updateStoreItem(id: string, formData: FormData) {
  const supabase = createAdminClient();

  const name = formData.get("name") as string;
  const image_url = (formData.get("image_url") as string) || null;
  const affiliate_url = formData.get("affiliate_url") as string;
  const category = formData.get("category") as string;
  const tag = (formData.get("tag") as string) || null;
  const sort_order = parseInt(formData.get("sort_order") as string, 10) || 0;
  const description = (formData.get("description") as string) || null;

  if (!name || !affiliate_url || !category) {
    throw new Error("Name, affiliate URL, and category are required");
  }

  const { error } = await supabase
    .from("store_items")
    .update({ name, image_url, affiliate_url, category, tag, sort_order, description })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/store");
}

export async function deleteStoreItem(id: string) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("store_items").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/store");
}

export async function toggleStoreItemActive(id: string, isActive: boolean) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("store_items")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/store");
}
