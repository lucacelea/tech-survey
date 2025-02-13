"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { BusinessUnit } from "@prisma/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Section } from "~/models/types";
import { api } from "~/trpc/react";
import { Form, FormControl, FormField, FormItem } from "./form";
import { Input } from "./input";
import { Label } from "./label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

const formSchema = z.object({
  role: z.string().optional(),
  tech: z.string().optional(),
  unit: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

const useDebounce = (value: string | undefined, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const ShowTechSearchWrapper = ({
  roles,
  businessUnits,
}: {
  roles: Section[];
  businessUnits: BusinessUnit[];
}) => {
  const path = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: searchParams.get("role") ?? "",
      tech: searchParams.get("tech") ?? "",
      unit: searchParams.get("unit") ?? "",
    },
  });

  const { role, tech, unit } = form.watch();
  const debouncedTech = useDebounce(tech);
  const { mutate: logUsageMetric } =
    api.usageMetricLogger.logUsageMetric.useMutation();

  // Log when tech input changes (debounced)
  useEffect(() => {
    if (!debouncedTech) return;
    logUsageMetric({
      logMessage: "show-tech-search-wrapper-tech-changed-" + debouncedTech,
    });
  }, [debouncedTech, logUsageMetric]);

  // Log dropdown changes immediately
  useEffect(() => {
    if (!role) return;
    logUsageMetric({
      logMessage: "show-tech-search-wrapper-role-changed-" + role,
    });
  }, [role, logUsageMetric]);

  // Log dropdown changes immediately
  useEffect(() => {
    if (!unit) return;
    logUsageMetric({
      logMessage: "show-tech-search-wrapper-unit-changed-" + unit,
    });
  }, [unit, logUsageMetric]);

  // Whenever form values change, generate a new query string and push
  useEffect(() => {
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (tech) params.set("tech", tech);
    if (unit) params.set("unit", unit);

    router.push(`${path}?${params.toString()}`);
  }, [role, tech, unit, path, router]);

  function onSubmit(values: FormSchema) {
    const params = new URLSearchParams();
    if (values.role) params.set("role", values.role);
    if (values.tech) params.set("tech", values.tech);
    if (values.unit) params.set("unit", values.unit);

    router.push(`${path}?${params.toString()}`);
  }

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-9">
            <div className="sm:col-span-3">
              <FormField
                control={form.control}
                name="tech"
                render={({ field }) => (
                  <FormItem>
                    <Label>Viewing results for technology:</Label>
                    <FormControl>
                      <Input placeholder="Search the technology" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="sm:col-span-3">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <Label>Viewing results for role:</Label>
                    <Select
                      onValueChange={(val) =>
                        field.onChange(val === "no-role" ? undefined : val)
                      }
                      value={field.value ?? "no-role"}
                    >
                      <FormControl>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <>
                        <SelectContent>
                          <SelectItem value={"no-role"} key={"no-role"}>
                            No role
                          </SelectItem>
                          {roles.map((r) => (
                            <SelectItem value={r.label} key={r.id}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <div className="sm:col-span-3">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <Label>Viewing results for unit:</Label>
                    <Select
                      onValueChange={(val) =>
                        field.onChange(val === "no-unit" ? undefined : val)
                      }
                      value={field.value ?? "no-unit"}
                    >
                      <FormControl>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select a unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={"no-unit"} key={"no-unit"}>
                          No unit
                        </SelectItem>
                        {businessUnits.map((u) => (
                          <SelectItem value={u.unit} key={u.id}>
                            {u.unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ShowTechSearchWrapper;
