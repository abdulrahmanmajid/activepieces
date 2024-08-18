import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { ApMarkdown } from '@/components/custom/markdown';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { platformApi } from '@/lib/platforms-api';
import { Platform, UpdatePlatformRequestBody } from '@activepieces/shared';

type NewOAuth2DialogProps = {
  providerName: 'google' | 'github';
  providerDisplayName: string;
  platform: Platform;
  connected: boolean;
  refetch: () => Promise<void>;
};

const OAuth2FormValues = Type.Object({
  clientId: Type.String({
    minLength: 1,
  }),
  clientSecret: Type.String({
    minLength: 1,
  }),
});
type OAuth2FormValues = Static<typeof OAuth2FormValues>;

export const NewOAuth2Dialog = ({
  providerDisplayName,
  providerName,
  platform,
  connected,
  refetch,
}: NewOAuth2DialogProps) => {
  const [open, setOpen] = useState(false);
  const form = useForm<OAuth2FormValues>({
    resolver: typeboxResolver(OAuth2FormValues),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (request: UpdatePlatformRequestBody) => {
      await platformApi.update(request, platform.id);
      await refetch();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Single sign on settings updated',
        duration: 3000,
      });
      setOpen(false);
    },
    onError: (error) => {
      console.error(error);
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          form.reset();
        }
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>
        {connected ? (
          <Button
            size={'sm'}
            className="w-32 text-destructive"
            variant={'basic'}
            loading={isPending}
            onClick={(e) => {
              mutate({
                federatedAuthProviders: {
                  ...platform.federatedAuthProviders,
                  [providerName]: undefined,
                },
              });
              e.preventDefault();
            }}
          >
            Disable
          </Button>
        ) : (
          <Button
            size={'sm'}
            className="w-32"
            variant={'basic'}
            onClick={() => setOpen(true)}
          >
            Enable
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure {providerDisplayName} SSO</DialogTitle>
        </DialogHeader>
        <div className="mb-4">
          <ApMarkdown
            markdown={`
Read more information about how to configure ${providerDisplayName} SSO
[here](https://www.activepieces.com/docs/security/sso).
`}
          />
        </div>

        <Form {...form}>
          <form
            className="grid space-y-4"
            onSubmit={form.handleSubmit((data) => {
              mutate({
                federatedAuthProviders: {
                  ...platform.federatedAuthProviders,
                  [providerName]: data,
                },
              });
            })}
          >
            <FormField
              name="clientId"
              render={({ field }) => (
                <FormItem className="grid space-y-4">
                  <Label htmlFor="clientId">
                    {providerDisplayName} Client ID
                  </Label>
                  <Input
                    {...field}
                    required
                    id="clientId"
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="clientSecret"
              render={({ field }) => (
                <FormItem className="grid space-y-4">
                  <Label htmlFor="clientSecret">
                    {providerDisplayName} Client Secret
                  </Label>
                  <Input
                    {...field}
                    required
                    id="clientSecret"
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                loading={isPending}
                disabled={!form.formState.isValid}
                type="submit"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
