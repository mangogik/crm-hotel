// resources/js/Pages/Settings.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { usePage, router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Phone,
  Mail,
  MapPin,
  Clock,
  Globe,
} from "lucide-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

/* helper: ubah snake_case jadi Title Case */
function prettyLabelFromKey(key) {
  // khusus beberapa key biar lebih manusiawi
  const map = {
    hotel_name: "Hotel Name",
    hotel_tagline: "Tagline",
    hotel_logo_url: "Logo",
    hotel_phone: "Phone",
    hotel_email: "Email",
    hotel_address: "Address",
    hotel_hours: "Hours",
    support_whatsapp_number: "Support Contact",
    support_instagram_url: "Instagram",
    support_facebook_url: "Facebook",
    n8n_secret_token: "n8n Secret Token",
    gemini_api_key: "Gemini API Key",
  };
  if (map[key]) return map[key];

  // fallback generic transform
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SettingsPage() {
  const { props } = usePage();
  const dbSettings = props.settings || {}; // object keyed by setting key

  const didInitRef = useRef(false);

  // local state
  const [branding, setBranding] = useState([]);
  const [contact, setContact] = useState([]);
  const [advancedCombined, setAdvancedCombined] = useState([]);

  const [form, setForm] = useState({});
  const [initialForm, setInitialForm] = useState({});

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [initialLogoPreview, setInitialLogoPreview] = useState("");

  const [showPasswords, setShowPasswords] = useState({});
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // ref ke hidden file input buat trigger via tombol custom
  const logoInputRef = useRef(null);

  // init sekali
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    // Flatten dbSettings jadi array
    const flatSettings = Object.entries(dbSettings).map(
      ([key, data]) => ({
        key,
        value: data?.value ?? "",
        group: data?.group ?? "other",
        type: data?.type ?? "string",
        description:
          data?.description ??
          prettyLabelFromKey(key),
      })
    );

    // Siapkan buffer untuk grouping manual:
    const brandingArr = [];
    const contactArr = [];
    const advancedArr = [];

    const initFormTmp = {};
    const initShowPwdTmp = {};

    flatSettings.forEach((setting) => {
      const { key, value, group, type } = setting;

      // --- mapping kita sendiri, override group DB
      if (
        [
          "hotel_name",
          "hotel_tagline",
          "hotel_logo_url",
        ].includes(key)
      ) {
        brandingArr.push(setting);
      } else if (
        [
          "hotel_phone",
          "hotel_email",
          "hotel_address",
          "hotel_hours",
          "support_whatsapp_number",
          "support_instagram_url",
          "support_facebook_url",
        ].includes(key)
      ) {
        contactArr.push(setting);
      } else if (
        [
          "n8n_secret_token",
          "gemini_api_key",
        ].includes(key)
      ) {
        advancedArr.push({
          ...setting,
          // Force treat these as secret:
          type: "secret",
        });
      } else {
        // fallback: kalau group 'advanced' / 'automation' dari DB, masukkan ke advanced
        if (
          group === "advanced" ||
          group === "automation"
        ) {
          advancedArr.push(setting);
        }
      }

      // init value ke form
      initFormTmp[key] = value ?? "";

      // default password visibility hidden untuk secret
      if (type === "secret") {
        initShowPwdTmp[key] = false;
      }
    });

    // cari logo preview awal
    const logoRow = flatSettings.find(
      (s) => s.key === "hotel_logo_url"
    );
    const logoVal = logoRow?.value || "";

    setBranding(brandingArr);
    setContact(contactArr);
    setAdvancedCombined(advancedArr);

    setForm(initFormTmp);
    setInitialForm(initFormTmp);

    setLogoPreview(logoVal);
    setInitialLogoPreview(logoVal);

    setShowPasswords(initShowPwdTmp);
  }, [dbSettings]);

  /* ------------ derived: apakah ada perubahan? ------------ */
  const isDirty = useMemo(() => {
    // cek perubahan nilai text
    const keys = Object.keys(initialForm);
    for (const k of keys) {
      if (form[k] !== initialForm[k]) {
        return true;
      }
    }

    // cek perubahan logo (kalau user pilih file baru OR preview beda)
    if (logoFile) return true;
    if (logoPreview !== initialLogoPreview)
      return true;

    return false;
  }, [form, initialForm, logoFile, logoPreview, initialLogoPreview]);

  /* ------------ handlers ------------ */
  function handleInputChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleLogoButtonClick() {
    if (logoInputRef.current) {
        logoInputRef.current.click();
    }
  }

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  }

  function togglePasswordVisibility(field) {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    const data = new FormData();

    // text values
    Object.entries(form).forEach(([key, val]) => {
      data.append(key, val ?? "");
    });

    // file logo (opsional)
    if (logoFile) {
      data.append("hotel_logo_file", logoFile);
    }

    router.post(route("settings.update"), data, {
      forceFormData: true,
    });
  }

  /* ------------ render helpers ------------ */

  function renderField(setting) {
    const { key, type, description } = setting;
    const label = prettyLabelFromKey(key);

    // SPECIAL: logo
    if (key === "hotel_logo_url") {
      return (
        <div className="md:col-span-2 space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            {label}
          </Label>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Preview box */}
            <div className="shrink-0 w-28 h-28 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Current Logo"
                  className="object-contain max-h-full max-w-full"
                />
              ) : (
                <span className="text-[11px] text-slate-400">
                  No Logo
                </span>
              )}
            </div>

            {/* Upload area */}
            <div className="flex-1 text-sm text-slate-600">
              {/* hidden input file */}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />

              {/* custom button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleLogoButtonClick}
                className="flex items-center gap-2 h-10 rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium px-3"
              >
                <ImageIcon className="h-4 w-4 text-slate-600" />
                <span>Change Logo</span>
              </Button>

              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                PNG/JPG/WebP/SVG · Max 2MB.
                Logo lama akan diganti otomatis.
              </p>
            </div>
          </div>

          {/* Help text under whole block */}
          {description && (
            <p className="text-[11px] text-slate-500 leading-relaxed mt-2">
              {description}
            </p>
          )}
        </div>
      );
    }

    // SECRET FIELD (API keys, tokens, dsb)
    if (type === "secret") {
      return (
        <div className="space-y-2">
          <Label
            htmlFor={key}
            className="text-sm font-medium text-slate-700 flex items-center gap-2"
          >
            <span>{label}</span>
            <span className="text-[10px] bg-red-100 text-red-600 px-2 py-[2px] rounded-full font-medium">
              Sensitive
            </span>
          </Label>

          <div className="relative">
            <Input
              id={key}
              name={key}
              value={form[key] || ""}
              onChange={handleInputChange}
              type={showPasswords[key] ? "text" : "password"}
              className="text-sm h-10 pr-10 rounded-lg border-slate-200 focus:border-red-500 focus:ring-red-500/20"
            />

            <button
              type="button"
              onClick={() => togglePasswordVisibility(key)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
            >
              {showPasswords[key] ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {description && (
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      );
    }

    // NORMAL TEXT FIELD
    return (
      <div className="space-y-2">
        <Label
          htmlFor={key}
          className="text-sm font-medium text-slate-700"
        >
          {label}
        </Label>

        <Input
          id={key}
          name={key}
          value={form[key] || ""}
          onChange={handleInputChange}
          className="text-sm h-10 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
        />

        {description && (
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    );
  }

  /* ------------ RENDER MAIN PAGE ------------ */

  return (
    <div className="mx-auto w-full py-2 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Settings
        </h1>
        <p className="text-base text-slate-500 mt-2">
          Update branding, contact info, and advanced
          credentials.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* BRANDING */}
        <Card className="border border-slate-200 shadow-md p-6 rounded-2xl bg-white overflow-hidden">
          <div className="flex items-center mb-6">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-3">
              <ImageIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Branding
              </h2>
              <p className="text-sm text-slate-500">
                Logo dan identitas hotel.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {branding.map((setting) => (
              <div
                key={setting.key}
                className={
                  setting.key === "hotel_logo_url"
                    ? "md:col-span-2"
                    : ""
                }
              >
                {renderField(setting)}
              </div>
            ))}
          </div>
        </Card>

        {/* CONTACT */}
        <Card className="border border-slate-200 shadow-md p-6 rounded-2xl bg-white overflow-hidden">
          <div className="flex items-center mb-6">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mr-3">
              <Phone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Contact & Info
              </h2>
              <p className="text-sm text-slate-500">
                Informasi publik yang tampil di footer,
                invoice, dan halaman bantuan.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {contact.map((setting) => (
              <div key={setting.key}>{renderField(setting)}</div>
            ))}
          </div>
        </Card>

        {/* ADVANCED (COLLAPSIBLE) */}
        <div className="border-2 border-red-200 rounded-2xl overflow-hidden bg-gradient-to-br from-red-50 to-orange-50 shadow-lg">
          <button
            type="button"
            onClick={() =>
              setIsAdvancedOpen(!isAdvancedOpen)
            }
            className="w-full px-6 py-5 flex items-center justify-between text-left bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700 transition-all duration-300"
          >
            <div className="flex items-center">
              <div className="bg-white/20 p-2 rounded-lg mr-3">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Advanced Settings
                  <Lock className="h-4 w-4" />
                </h2>
                <p className="text-sm opacity-90 mt-1">
                  API keys & automation tokens (Admin only)
                </p>
              </div>
            </div>
            <div className="bg-white/20 p-1 rounded-lg">
              {isAdvancedOpen ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </div>
          </button>

          {isAdvancedOpen && (
            <div className="p-6 bg-white">
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-amber-800">
                      Security Warning
                    </h3>
                    <p className="text-sm text-amber-700 mt-1">
                      Perubahan di bagian ini bisa
                      mempengaruhi bot, automasi pesan,
                      dan AI analytics. Jangan share
                      token ini ke orang lain.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {advancedCombined.map((setting) => (
                  <div key={setting.key}>
                    {renderField(setting)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator className="my-8" />

        {/* Save button hanya muncul kalau ada perubahan */}
        {isDirty && (
          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-slate-900 text-white hover:bg-black h-11 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              Save Settings
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

SettingsPage.layout = (page) => (
  <AuthenticatedLayout>{page}</AuthenticatedLayout>
);
