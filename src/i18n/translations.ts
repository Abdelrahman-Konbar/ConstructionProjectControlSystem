export type Lang = 'ar' | 'en'
export const translate = (lang: Lang, ar: string, en: string) => (lang === 'ar' ? ar : en)

export const languageDirection = (lang: Lang): 'rtl' | 'ltr' => (lang === 'ar' ? 'rtl' : 'ltr')
let activeLanguage: Lang = 'ar'
export const setActiveLanguage = (lang: Lang) => { activeLanguage = lang }
export const getActiveLanguage = () => activeLanguage

const statusTranslations: Record<string, [string, string]> = {
  ACTIVE: ['نشط', 'Active'], AT_RISK: ['معرّض للخطر', 'At risk'], PLANNING: ['مخطط', 'Planning'], COMPLETED: ['مكتمل', 'Completed'], CLOSED: ['مغلق', 'Closed'],
  DRAFT: ['مسودة', 'Draft'], SUBMITTED: ['مُرسل', 'Submitted'], PENDING: ['قيد الانتظار', 'Pending'], PENDING_APPROVAL: ['بانتظار الاعتماد', 'Pending approval'], APPROVED: ['معتمد', 'Approved'], REJECTED: ['مرفوض', 'Rejected'],
  OPEN: ['مفتوح', 'Open'], QUOTES_RECEIVED: ['تم استلام العروض', 'Quotes received'], EVALUATION: ['قيد التقييم', 'Evaluation'], AWARDED: ['مُرسى', 'Awarded'], ISSUED: ['صادر', 'Issued'], PARTIALLY_RECEIVED: ['مستلم جزئياً', 'Partially received'], RECEIVED: ['مستلم', 'Received'], POSTED: ['مُرحّل', 'Posted'], IN_PROCUREMENT: ['قيد الشراء', 'In procurement'],
  CANCELLED: ['ملغى', 'Cancelled'], INACTIVE: ['غير نشط', 'Inactive'], ON_HOLD: ['متوقف مؤقتاً', 'On hold'],
  Active: ['نشط', 'Active'], Approved: ['معتمد', 'Approved'],
}

export const localizeStatus = (lang: Lang, status: string) => statusTranslations[status] ? translate(lang, ...statusTranslations[status]) : status
const roleTranslations: Record<string, string> = {
  OWNER_EXECUTIVE: 'المالك / التنفيذي', ADMIN: 'مدير النظام', PROJECT_MANAGER: 'مدير المشروع', SITE_ENGINEER: 'مهندس الموقع', PROCUREMENT: 'المشتريات', FINANCE: 'المالية', QUANTITY_SURVEYOR: 'حصر الكميات', STOREKEEPER: 'أمين المستودع',
}
export const localizeRole = (lang: Lang, role: string) => lang === 'ar' ? roleTranslations[role] ?? role : role

const uiTranslations: Record<string, string> = {
  'Project BOQ from the API': 'جدول الكميات من النظام', 'Real budget and cost-code foundation': 'أساس الميزانية وأكواد التكلفة الفعلية', 'Cost codes and budget lines': 'أكواد التكلفة وبنود الميزانية', 'Live supplier record': 'بيانات المورد الفعلية',
  'Company membership and role visibility': 'عضويات الشركة والأدوار', 'Tenant-scoped aggregations from the reporting API': 'تجميعات الشركة من واجهة التقارير', 'Company configuration and policy settings': 'إعدادات الشركة والسياسات', 'Supplier invitations': 'دعوات الموردين', 'Edit supplier': 'تعديل المورد', 'Edit draft request': 'تعديل الطلب المسودة', 'Edit draft expense': 'تعديل المصروف المسودة', 'Record goods receipt': 'تسجيل استلام المواد', 'Purchase order items': 'بنود أمر الشراء', 'Line items': 'البنود',
  'Loading BOQ…': 'جارٍ تحميل جدول الكميات…', 'Loading cost control…': 'جارٍ تحميل مراقبة التكلفة…', 'Loading suppliers…': 'جارٍ تحميل الموردين…', 'Loading material requests…': 'جارٍ تحميل طلبات المواد…', 'Loading RFQs…': 'جارٍ تحميل طلبات التسعير…', 'Loading purchase orders…': 'جارٍ تحميل أوامر الشراء…', 'Loading receipts…': 'جارٍ تحميل الاستلامات…', 'Loading expenses…': 'جارٍ تحميل المصروفات…', 'Loading progress…': 'جارٍ تحميل الإنجاز…', 'Loading documents…': 'جارٍ تحميل المستندات…', 'Loading team…': 'جارٍ تحميل الفريق…',
  'Unable to load BOQ.': 'تعذر تحميل جدول الكميات.', 'Unable to load cost control.': 'تعذر تحميل مراقبة التكلفة.', 'Unable to load suppliers.': 'تعذر تحميل الموردين.', 'Unable to load material requests.': 'تعذر تحميل طلبات المواد.', 'Unable to load RFQs.': 'تعذر تحميل طلبات التسعير.', 'Unable to load purchase orders.': 'تعذر تحميل أوامر الشراء.', 'Unable to load receipts.': 'تعذر تحميل الاستلامات.', 'Unable to load expenses.': 'تعذر تحميل المصروفات.', 'Unable to load progress.': 'تعذر تحميل الإنجاز.', 'Unable to load documents.': 'تعذر تحميل المستندات.', 'Unable to load team.': 'تعذر تحميل الفريق.',
  'Item': 'البند', 'Description': 'الوصف', 'Unit': 'الوحدة', 'Qty': 'الكمية', 'Rate': 'السعر', 'Amount': 'المبلغ', 'Status': 'الحالة', 'Code': 'الرمز', 'Cost account': 'حساب التكلفة', 'Budget': 'الميزانية', 'Committed': 'الملتزم به', 'Actual': 'الفعلي', 'No.': 'الرقم', 'Project': 'المشروع', 'Suppliers': 'الموردون', 'Quotes': 'العروض', 'Closes': 'الإغلاق', 'Value': 'القيمة', 'Received': 'المستلم', 'Delivery': 'التوريد', 'GRN': 'رقم الاستلام', 'PO': 'أمر الشراء', 'Material': 'المادة', 'Date': 'التاريخ', 'Category': 'الفئة', 'Vendor / payee': 'المورد / المستفيد', 'Type': 'النوع', 'Record': 'السجل', 'Actions': 'الإجراءات', 'Name': 'الاسم', 'Email': 'البريد الإلكتروني', 'Job title': 'المسمى الوظيفي', 'Role': 'الدور', 'Created': 'تاريخ الإنشاء', 'Linked record': 'السجل المرتبط',
  'Edit': 'تعديل', 'Save': 'حفظ', 'Save supplier': 'حفظ المورد', 'Save draft': 'حفظ المسودة', 'Submit': 'إرسال', 'Approve': 'اعتماد', 'Reject': 'رفض', 'Issue RFQ': 'إصدار طلب التسعير', 'Award': 'ترسية', 'Add': 'إضافة', 'Remove': 'إزالة', 'Invited': 'تمت الدعوة', 'Not invited': 'غير مدعو', 'Active': 'نشط', 'Live portfolio': 'المحفظة الفعلية', 'From posted receipts and expenses': 'من الاستلامات والمصروفات المرحلة', 'From purchase orders': 'من أوامر الشراء', 'Budget service calculation': 'حساب خدمة الميزانية', 'SAR': 'ر.س', 'days': 'أيام',
  'New expense': 'مصروف جديد', 'New subcontractor': 'مقاول باطن جديد', 'New progress update': 'تحديث إنجاز جديد', 'Document metadata': 'بيانات المستند', 'Company settings': 'إعدادات الشركة', 'Project portfolio': 'محفظة المشاريع', 'Revised budget': 'الميزانية المعدلة', 'Contract': 'العقد', 'Measured quantity': 'الكمية المقاسة', 'Specialties': 'التخصصات', 'Supplier name': 'اسم المورد', 'Material description': 'وصف المادة', 'Purpose': 'الغرض', 'Search BOQ': 'البحث في جدول الكميات', 'Search cost codes': 'البحث في أكواد التكلفة', 'Search requests': 'البحث في الطلبات', 'Search RFQs': 'البحث في طلبات التسعير', 'Search suppliers': 'البحث في الموردين', 'Search purchase orders': 'البحث في أوامر الشراء', 'Search expenses': 'البحث في المصروفات', 'Subcontractors from the API': 'مقاولو الباطن من النظام', 'Progress measurements from the API': 'قياسات الإنجاز من النظام', 'Document records from the API': 'سجلات المستندات من النظام', 'RFQs from the API': 'طلبات التسعير من النظام', 'Purchase orders from the API': 'أوامر الشراء من النظام', 'Receipts from the API': 'سجلات الاستلام من النظام', 'Expenses from the API': 'المصروفات من النظام', 'Requests from the API': 'الطلبات من النظام', 'Approval records from the API': 'سجلات الاعتماد من النظام', 'pending approvals': 'اعتمادات معلقة', 'No approvals found.': 'لا توجد اعتمادات.', 'Entity': 'الكيان', 'No data': 'لا توجد بيانات', 'No results': 'لا توجد نتائج', 'Loading': 'جارٍ التحميل', 'Error': 'خطأ', 'View': 'عرض', 'Details': 'التفاصيل', 'Close': 'إغلاق', 'Issue': 'إصدار', 'Receive': 'استلام', 'Filter': 'تصفية', 'Reset': 'إعادة ضبط', 'Export': 'تصدير', 'Print': 'طباعة', 'Upload': 'رفع', 'Download': 'تنزيل', 'Update': 'تحديث', 'Planned': 'المخطط', 'Variance': 'الانحراف', 'Pending': 'قيد الانتظار', 'Inactive': 'غير نشط', 'PO total': 'إجمالي أمر الشراء', 'Subtotal': 'الإجمالي الفرعي', 'Tax': 'الضريبة', 'Steps': 'المراحل', 'Expense details': 'تفاصيل المصروف',
  'Remaining': 'المتبقي', 'Post receipt': 'ترحيل الاستلام', 'Record receipt': 'تسجيل الاستلام', 'Invite suppliers': 'دعوة الموردين', 'RFQ title': 'عنوان طلب التسعير', 'Something went wrong.': 'حدث خطأ ما.', 'No records found.': 'لا توجد سجلات.', 'MaterialRequest': 'طلب مواد', 'PurchaseOrder': 'أمر شراء', 'Expense': 'مصروف',
  '+ Add update': '+ إضافة تحديث', '+ Add item': '+ إضافة بند', '+ New request': '+ طلب جديد', '+ New RFQ': '+ طلب تسعير جديد', '+ Add supplier': '+ إضافة مورد', '+ Add subcontractor': '+ إضافة مقاول باطن', '+ Add expense': '+ إضافة مصروف', '+ Add quote': '+ إضافة عرض',
  'Notes': 'ملاحظات', 'Progress': 'الإنجاز', 'Items': 'البنود', 'Supplier': 'المورد', 'Contact': 'جهة الاتصال', 'Rating': 'التقييم', 'POs': 'أوامر الشراء', 'Ordered': 'المطلوب', 'Needed': 'مطلوب في', 'By': 'بواسطة',
  'Save update': 'حفظ التحديث', 'Save subcontractor': 'حفظ مقاول الباطن', 'Create RFQ': 'إنشاء طلب تسعير', 'Select an RFQ for comparison': 'اختر طلب تسعير للمقارنة', 'Select an RFQ to open its live supplier quote comparison.': 'اختر طلب تسعير لفتح مقارنة عروض الموردين الفعلية.',
  'Progress %': 'نسبة الإنجاز', 'Measured quantity': 'الكمية المقاسة', 'Search progress': 'البحث في الإنجاز', 'Loading progress…': 'جارٍ تحميل الإنجاز…', 'Unable to load progress.': 'تعذر تحميل الإنجاز.', 'New progress update': 'تحديث إنجاز جديد', 'requests from the API': 'طلبات من النظام',
  'Loading subcontractors…': 'جارٍ تحميل مقاولي الباطن…', 'Unable to load subcontractors.': 'تعذر تحميل مقاولي الباطن.', 'Loading approvals…': 'جارٍ تحميل الاعتمادات…', 'Unable to load approvals.': 'تعذر تحميل الاعتمادات.',
 }

export const localizeUiText = (lang: Lang, text: string) => {
  if (lang === 'en') return text
  if (uiTranslations[text]) return uiTranslations[text]
  const templates: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
    [/^(\d+) RFQs from the API$/, (m) => `${m[1]} طلبات تسعير من النظام`],
    [/^(\d+) purchase orders from the API$/, (m) => `${m[1]} أوامر شراء من النظام`],
    [/^(\d+) receipts from the API$/, (m) => `${m[1]} سجلات استلام من النظام`],
    [/^(\d+) expenses from the API$/, (m) => `${m[1]} مصروفات من النظام`],
    [/^(\d+) requests from the API$/, (m) => `${m[1]} طلبات من النظام`],
    [/^(\d+) suppliers from the API$/, (m) => `${m[1]} موردين من النظام`],
    [/^(\d+) subcontractors from the API$/, (m) => `${m[1]} مقاولين من النظام`],
    [/^(\d+) progress measurements from the API$/, (m) => `${m[1]} قياسات إنجاز من النظام`],
    [/^(\d+) document records from the API$/, (m) => `${m[1]} سجلات مستندات من النظام`],
    [/^(\d+) approval records from the API$/, (m) => `${m[1]} سجلات اعتماد من النظام`],
    [/^(\d+) pending approvals$/, (m) => `${m[1]} اعتمادات معلقة`],
    [/^Remaining: (.+)$/, (m) => `المتبقي: ${m[1]}`],
  ]
  const match = templates.find(([pattern]) => pattern.test(text))
  return match ? match[1](text.match(match[0])!) : text
}
