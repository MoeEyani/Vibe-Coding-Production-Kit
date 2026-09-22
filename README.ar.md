# Vibe Coding Production Kit — الدليل العربي

> ابنِ بالذكاء الاصطناعي كفريق هندسي، لا كمحادثة طويلة.

**Vibe Coding Production Kit** هو نظام عمل احترافي لتحويل الـVibe Coding من “اكتب برومبت ودع الوكيل يبني كل شيء” إلى هندسة برمجيات منضبطة: مواصفات، معمارية، مهام صغيرة، اختبارات، مراجعة، أمن، CI، وإطلاق قابل للمراقبة والاسترجاع.

## الفكرة الأساسية

**لا تطلب من الـAI أن يبني المشروع؛ ابنِ نظاماً يجعل من الصعب عليه أن يبنيه بطريقة خاطئة.**

الإنسان يملك القرارات والنية والمخاطر والمفاضلات. والـAI يساعد في البحث والتخطيط والتنفيذ والاختبار والمراجعة والتوثيق ضمن حدود واضحة.

## تشغيل سريع خلال دقيقة

يمكن تشغيل الـCLI مباشرة من GitHub بدون تثبيت عالمي:

```bash
npx --yes github:MoeEyani/Vibe-Coding-Production-Kit init . --agent all
```

أو لمشروع آخر:

```bash
npx --yes github:MoeEyani/Vibe-Coding-Production-Kit init ./my-app --agent claude --stack auto --yes
```

الـCLI لا يعتمد على مكتبات runtime خارجية، ولا يكتب فوق ملفات موجودة إلا عند استخدام `--force` صراحة. كما يستطيع `--stack auto` اكتشاف TypeScript وPython وGo وملء أوامر التحقق التي يمكن إثباتها من ملفات المشروع فقط. ويمكن استخدام `--dry-run` لمشاهدة ما سيتم إنشاؤه قبل أي تعديل. التفاصيل في `docs/CLI.md` و`docs/STACK-PROFILES.md`.

## فحص مشروع موجود

يوجد أيضاً أمر `doctor` للقراءة فقط، يميّز بين وجود القوالب وبين إعدادها فعلياً:

```bash
npx --yes --package=github:MoeEyani/Vibe-Coding-Production-Kit vibe-coding-production doctor .
```

يعرض `PASS / WARN / FAIL` لأوامر التحقق، ملفات الـSource of Truth، القوالب التي ما زالت غير مخصصة، CI، ودورة التخطيط/المراجعة. استخدم `--json` للأتمتة و`--strict` لجعل التحذيرات تفشل في CI. التفاصيل في `docs/DOCTOR.md`.

## مثال تطبيقي مكتمل

لرؤية النظام مطبقاً على Feature حقيقية بدلاً من قوالب فارغة، راجع `examples/reference-saas-invite/`. المثال يغطي دعوة أعضاء في SaaS متعدد المستأجرين مع PRD وDomain/Data/Architecture وADR وThreat Model وTest Strategy وTask محددة وكود طبقي واختبارات للحالات السلبية مثل cross-tenant وreplay وexpiry وemail mismatch.

```bash
cd examples/reference-saas-invite
npm test
npm run check
```

المثال يذكر صراحة ما لم يثبته بعد على مستوى قاعدة البيانات والـHTTP والمصادقة والبنية التشغيلية، بدلاً من وصف Demo على أنه Production-ready.

## المسار الكامل

```text
الفكرة
  -> Product Brief
  -> PRD + Acceptance Criteria
  -> User Flows
  -> Domain Model
  -> Architecture + ADRs
  -> Data Model
  -> Threat Model
  -> Test Strategy
  -> Epics / Stories / Tasks
  -> Plan Before Code
  -> Implementation
  -> Automated Verification
  -> Independent Review
  -> CI Gates
  -> Staging / Production
  -> Observability
  -> تحسين مستمر
```

## ابدأ من هنا

املأ الملفات بهذا الترتيب:

1. `docs/product/PRODUCT-BRIEF.md`
2. `docs/product/PRD.md`
3. `docs/product/USER-FLOWS.md`
4. `docs/architecture/DOMAIN.md`
5. `docs/architecture/ARCHITECTURE.md`
6. `docs/architecture/DATA-MODEL.md`
7. `docs/security/THREAT-MODEL.md`
8. `docs/testing/TEST-STRATEGY.md`

ثم عدّل `AGENTS.md` ليحتوي أوامر مشروعك الحقيقية للبناء والاختبار والـlint والـtypecheck.

## قاعدة تنفيذ كل Task

لا تبدأ بالكود مباشرة. اجعل الوكيل أولاً:

1. يقرأ `AGENTS.md` والوثائق المرتبطة بالمهمة.
2. يعيد صياغة المطلوب.
3. يحدد الملفات والموديولات المتأثرة.
4. يقترح خطة تنفيذ.
5. يذكر المخاطر والحالات الطرفية.
6. يحدد الاختبارات المطلوبة.
7. يذكر أي تعارض معماري.

بعد الموافقة على الخطة، ينفذ **نطاق المهمة فقط**، ثم يشغل التحقق الآلي، ثم يراجع الـdiff، ثم يمر التغيير على Reviewer مستقل.

## الفرق عن Vibe Coding العادي

بدلاً من:

```text
Prompt -> كود كثير -> يبدو أنه يعمل
```

نستخدم:

```text
Source of Truth
      +
Small Scoped Tasks
      +
Agent Rules
      +
Automated Tests
      +
Independent Review
      +
CI Gates
```

## أهم الملفات

- `AGENTS.md`: دستور وكلاء البرمجة داخل المستودع.
- `docs/product/PRD.md`: السلوك والمتطلبات ومعايير القبول.
- `docs/architecture/ARCHITECTURE.md`: الحدود والاعتماديات والتصميم العام.
- `docs/architecture/adr/ADR-TEMPLATE.md`: تسجيل القرارات المعمارية وأسبابها.
- `docs/security/THREAT-MODEL.md`: تهديدات وضوابط قبل التنفيذ.
- `docs/delivery/DEFINITION-OF-READY.md`: متى تصبح المهمة جاهزة للبرمجة.
- `docs/delivery/DEFINITION-OF-DONE.md`: متى تعتبر المهمة منتهية فعلاً.
- `prompts/`: برومبتات تشغيلية للوكيل في كل مرحلة.

## قواعد لا نتنازل عنها

- لا Feature بدون Acceptance Criteria واضحة.
- لا قرار معماري مهم يبقى داخل Chat فقط.
- لا Task ضخمة وغير محددة للـAI.
- لا ثقة بعبارة “Everything should work”. الاختبارات وCI هما الحكم.
- لا Authorization في الواجهة فقط.
- لا Migration إنتاجية بدون مراجعة ومراعاة rollback.
- لا Refactor غير مرتبط داخل Feature PR.
- لا تعتمد على الوكيل الذي كتب الكود كمراجع وحيد له.
- أي نظام Production يجب أن يكون قابلاً للمراقبة والتشخيص والاسترجاع.

للتفاصيل الكاملة ابدأ من `docs/00-START-HERE.md`.
