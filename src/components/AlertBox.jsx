import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AlertBox({
  visible,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}) {
  if (!visible) return null;

  return (
    <View style={styles.overlay} accessibilityViewIsModal>
      <Pressable style={styles.backdrop} onPress={onCancel} />
      <View style={styles.dialog} accessibilityRole="alert">
        <View style={[styles.iconWrap, destructive && styles.destructiveIcon]}>
          <Ionicons
            name={destructive ? "warning-outline" : "information-circle-outline"}
            size={24}
            color={destructive ? "#B42318" : "#6D28D9"}
          />
        </View>
        <Text style={styles.title}>{title}</Text>
        {!!message && <Text style={styles.message}>{message}</Text>}
        <View style={styles.actions}>
          {!!cancelLabel && (
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={[styles.button, styles.cancelButton]}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={onConfirm}
            style={[
              styles.button,
              destructive ? styles.destructiveButton : styles.confirmButton,
              !cancelLabel && styles.singleButton,
            ]}
          >
            <Text style={styles.confirmText}>{confirmLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.48)",
  },
  dialog: {
    width: "100%",
    maxWidth: 420,
    padding: 22,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    elevation: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  destructiveIcon: { backgroundColor: "#FEF2F2" },
  title: {
    color: "#1E293B",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  message: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    alignSelf: "stretch",
    gap: 10,
    marginTop: 22,
  },
  button: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  confirmButton: { backgroundColor: "#6D28D9" },
  destructiveButton: { backgroundColor: "#DC2626" },
  singleButton: { flex: 0 },
  cancelText: { color: "#475569", fontSize: 13, fontWeight: "700" },
  confirmText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
});