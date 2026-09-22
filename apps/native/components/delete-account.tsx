import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";

import { authClient } from "@/lib/auth-client";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";
import { queryClient, trpc } from "@/utils/trpc";

function DeleteAccount() {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
  const [error, setError] = useState<string | null>(null);
  const deleteAccount = useMutation(trpc.member.deleteAccount.mutationOptions());

  async function onPress() {
    setError(null);
    try {
      await deleteAccount.mutateAsync();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to delete account");
      return;
    }
    await authClient.signOut();
    await queryClient.invalidateQueries();
  }

  return (
    <>
      {error ? (
        <Text style={[styles.errorText, { color: theme.notification }]}>{error}</Text>
      ) : null}
      <TouchableOpacity
        onPress={onPress}
        disabled={deleteAccount.isPending}
        style={[
          styles.button,
          {
            borderColor: theme.border,
            opacity: deleteAccount.isPending ? 0.5 : 1,
          },
        ]}
      >
        {deleteAccount.isPending ? (
          <ActivityIndicator size="small" color={theme.text} />
        ) : (
          <Text style={[styles.buttonText, { color: theme.text }]}>Delete account</Text>
        )}
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  errorText: {
    fontSize: 14,
    marginTop: 12,
  },
  button: {
    marginTop: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
  },
});

export { DeleteAccount };
