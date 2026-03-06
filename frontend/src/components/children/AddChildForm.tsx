import React, { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { useTranslation } from "react-i18next";
import { AvatarPicker } from "./AvatarPicker";
import { BouncePress } from "../common/BouncePress";
import { FONTS } from "../../constants/theme";

interface AddChildFormProps {
  onSave: (data: { displayName: string; age: number; grade: string; avatarUrl: string }) => void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  age?: string;
  grade?: string;
}

export function AddChildForm({ onSave, onCancel }: AddChildFormProps) {
  const { t } = useTranslation(["children", "common"]);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [grade, setGrade] = useState("");
  const [avatar, setAvatar] = useState("lion");
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      newErrors.name = t("validation.nameMinLength");
    } else if (trimmedName.length > 30) {
      newErrors.name = t("validation.nameMaxLength");
    }

    const ageNum = parseInt(age);
    if (!age.trim() || isNaN(ageNum) || ageNum < 3 || ageNum > 18) {
      newErrors.age = t("validation.ageRange");
    }

    if (!grade.trim()) {
      newErrors.grade = t("validation.gradeRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      displayName: name.trim(),
      age: parseInt(age),
      grade: grade.trim(),
      avatarUrl: avatar,
    });
    setName("");
    setAge("");
    setGrade("");
    setAvatar("lion");
    setErrors({});
  };

  const inputStyle = {
    backgroundColor: "#0D0B14",
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: FONTS.body,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  };

  return (
    <View>
      <AvatarPicker selected={avatar} onSelect={setAvatar} />

      <TextInput
        value={name}
        onChangeText={(t) => {
          setName(t);
          if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
        }}
        placeholder={t("form.namePlaceholder")}
        placeholderTextColor="#7B6B8A"
        style={[
          inputStyle,
          { borderColor: errors.name ? "#EF4444" : "#3D2E4A", marginBottom: 4 },
        ]}
      />
      {errors.name && (
        <Text style={{ color: "#EF4444", fontSize: 13, fontFamily: FONTS.body, marginBottom: 8, marginLeft: 8 }}>{errors.name}</Text>
      )}
      {!errors.name && <View style={{ marginBottom: 8 }} />}

      <View style={{ flexDirection: "row", gap: 12, marginBottom: 4 }}>
        <View style={{ flex: 1 }}>
          <TextInput
            value={age}
            onChangeText={(t) => {
              setAge(t);
              if (errors.age) setErrors((e) => ({ ...e, age: undefined }));
            }}
            placeholder={t("form.agePlaceholder")}
            placeholderTextColor="#7B6B8A"
            keyboardType="number-pad"
            style={[
              inputStyle,
              { borderColor: errors.age ? "#EF4444" : "#3D2E4A" },
            ]}
          />
          {errors.age && (
            <Text style={{ color: "#EF4444", fontSize: 13, fontFamily: FONTS.body, marginTop: 4, marginLeft: 8 }}>{errors.age}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <TextInput
            value={grade}
            onChangeText={(t) => {
              setGrade(t);
              if (errors.grade) setErrors((e) => ({ ...e, grade: undefined }));
            }}
            placeholder={t("form.gradePlaceholder")}
            placeholderTextColor="#7B6B8A"
            style={[
              inputStyle,
              { borderColor: errors.grade ? "#EF4444" : "#3D2E4A" },
            ]}
          />
          {errors.grade && (
            <Text style={{ color: "#EF4444", fontSize: 13, fontFamily: FONTS.body, marginTop: 4, marginLeft: 8 }}>{errors.grade}</Text>
          )}
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
        <BouncePress
          onPress={onCancel}
          style={{
            flex: 1,
            backgroundColor: "#3D2E4A",
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontFamily: "Bungee_400Regular" }}>{t("common:buttons.cancel")}</Text>
        </BouncePress>
        <BouncePress
          onPress={handleSave}
          style={{
            flex: 2,
            backgroundColor: "#10B981",
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontFamily: "Bungee_400Regular" }}>{t("form.savePlayer")}</Text>
        </BouncePress>
      </View>
    </View>
  );
}
