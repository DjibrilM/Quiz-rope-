import React from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../common/EmptyState";

export function EmptyChildrenState() {
  const { t } = useTranslation("children");

  return (
    <EmptyState
      illustration="noChildren"
      title={t("emptyTitle")}
      subtitle={t("emptySubtitle")}
    />
  );
}
