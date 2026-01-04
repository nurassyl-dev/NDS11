(() => {
  const vatRate = 0.16;
  const currency = "KZT";
  const moneyFormatter = new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  });

  const formatMoney = (value) => moneyFormatter.format(Math.round(value));
  const parseNumber = (value) => {
    if (!value) {
      return 0;
    }
    const normalized = value.toString().replace(/[^\d.,]/g, "").replace(",", ".");
    return normalized ? Number(normalized) : 0;
  };
  const escapeHtml = (value) =>
    value
      .toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const normalizeText = (value) => (value ? value.toString().trim() : "");
  const managerPhone = "87713226575";
  const managerPhoneDisplay = "+7 771 322-65-75";
  const deliveryLabels = {
    courier: "Курьер",
    pickup: "Самовывоз",
    transport: "Транспортная компания"
  };
  const paymentLabels = {
    card: "Картой онлайн",
    cash: "Наличные при получении",
    invoice: "Счет для юр.лица (ЭСФ)"
  };

  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  };

  const elements = {
    productGrid: document.getElementById("productGrid"),
    catalogEmpty: document.getElementById("catalogEmpty"),
    searchInput: document.getElementById("searchInput"),
    categorySelect: document.getElementById("categorySelect"),
    cartBody: document.getElementById("cartBody"),
    cartCount: document.getElementById("cartCount"),
    cartTotalNet: document.getElementById("cartTotalNet"),
    cartTotalVat: document.getElementById("cartTotalVat"),
    cartTotalGross: document.getElementById("cartTotalGross"),
    deliveryPriceNet: document.getElementById("deliveryPriceNet"),
    deliveryMethod: document.getElementById("deliveryMethod"),
    paymentMethod: document.getElementById("paymentMethod"),
    sumGoodsNet: document.getElementById("sumGoodsNet"),
    sumGoodsVat: document.getElementById("sumGoodsVat"),
    sumGoodsGross: document.getElementById("sumGoodsGross"),
    sumDeliveryNet: document.getElementById("sumDeliveryNet"),
    sumDeliveryVat: document.getElementById("sumDeliveryVat"),
    sumDeliveryGross: document.getElementById("sumDeliveryGross"),
    sumGrandTotal: document.getElementById("sumGrandTotal"),
    vatRateLabel: document.getElementById("vatRateLabel"),
    summaryItems: document.getElementById("summaryItems"),
    openCartBtn: document.getElementById("openCartBtn"),
    goCheckoutBtn: document.getElementById("goCheckoutBtn"),
    checkoutForm: document.getElementById("checkoutForm"),
    orderResult: document.getElementById("orderResult")
  };

  const cards = Array.from(document.querySelectorAll(".product-card"));
  const products = new Map();

  cards.forEach((card) => {
    const id = card.dataset.productId;
    if (!id) {
      return;
    }

    const priceNet = Number(card.dataset.priceNet || 0);
    const vat = Number(card.dataset.vatRate || vatRate);
    const nameEl = card.querySelector(".product-title");
    const name = nameEl ? nameEl.textContent.trim() : id;

    products.set(id, {
      id,
      name,
      priceNet,
      vatRate: vat
    });

    const priceEl = card.querySelector(".price-net");
    if (priceEl) {
      priceEl.textContent = formatMoney(priceNet);
    }

    const media = card.querySelector(".product-media");
    const image = card.dataset.image;
    if (media && image) {
      media.style.setProperty("--product-image", `url("${image}")`);
    }
  });

  const cart = new Map();

  const setText = (el, value) => {
    if (el) {
      el.textContent = value;
    }
  };

  const updateSummaryItems = () => {
    if (!elements.summaryItems) {
      return;
    }

    elements.summaryItems.innerHTML = "";

    if (cart.size === 0) {
      const li = document.createElement("li");
      li.textContent = "Корзина пуста";
      elements.summaryItems.appendChild(li);
      return;
    }

    cart.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.name} × ${item.qty}`;
      elements.summaryItems.appendChild(li);
    });
  };

  const calculateTotals = () => {
    let goodsNet = 0;
    let goodsVat = 0;
    let totalQty = 0;

    cart.forEach((item) => {
      const lineNet = item.priceNet * item.qty;
      const lineVat = lineNet * item.vatRate;
      goodsNet += lineNet;
      goodsVat += lineVat;
      totalQty += item.qty;
    });

    const goodsGross = goodsNet + goodsVat;
    const isPickup = elements.deliveryMethod && elements.deliveryMethod.value === "pickup";
    const deliveryNet = isPickup
      ? 0
      : parseNumber(elements.deliveryPriceNet ? elements.deliveryPriceNet.value : "");
    const deliveryVat = deliveryNet * vatRate;
    const deliveryGross = deliveryNet + deliveryVat;
    const grandTotal = goodsGross + deliveryGross;

    return {
      goodsNet,
      goodsVat,
      goodsGross,
      deliveryNet,
      deliveryVat,
      deliveryGross,
      grandTotal,
      totalQty
    };
  };

  const updateTotals = () => {
    const totals = calculateTotals();

    setText(elements.cartTotalNet, formatMoney(totals.goodsNet));
    setText(elements.cartTotalVat, formatMoney(totals.goodsVat));
    setText(elements.cartTotalGross, formatMoney(totals.goodsGross));

    setText(elements.sumGoodsNet, formatMoney(totals.goodsNet));
    setText(elements.sumGoodsVat, formatMoney(totals.goodsVat));
    setText(elements.sumGoodsGross, formatMoney(totals.goodsGross));

    setText(elements.sumDeliveryNet, formatMoney(totals.deliveryNet));
    setText(elements.sumDeliveryVat, formatMoney(totals.deliveryVat));
    setText(elements.sumDeliveryGross, formatMoney(totals.deliveryGross));

    setText(elements.sumGrandTotal, formatMoney(totals.grandTotal));
    setText(elements.cartCount, totals.totalQty.toString());

    if (elements.vatRateLabel) {
      elements.vatRateLabel.textContent = `${Math.round(vatRate * 100)}%`;
    }

    updateSummaryItems();
  };

  const getFieldValue = (id) => {
    const el = document.getElementById(id);
    return el ? normalizeText(el.value) : "";
  };

  const buildOrderMessage = (data, totals) => {
    const lines = [
      "Новый заказ с сайта BusParts KZ",
      `Дата: ${new Date().toLocaleString("ru-RU")}`,
      `Имя: ${data.name}`,
      `Телефон: ${data.phone}`,
      `Email: ${data.email || "—"}`,
      `Город: ${data.city}`,
      `Адрес: ${data.address}`,
      `Доставка: ${data.deliveryMethod}`,
      `Оплата: ${data.paymentMethod}`,
      `Комментарий: ${data.comment || "—"}`,
      "Товары:"
    ];

    data.items.forEach((item) => {
      const lineNet = item.priceNet * item.qty;
      const lineVat = lineNet * item.vatRate;
      const lineGross = lineNet + lineVat;
      lines.push(`- ${item.name} × ${item.qty} = ${formatMoney(lineGross)}`);
    });

    lines.push(
      `Сумма без НДС: ${formatMoney(totals.goodsNet)}`,
      `НДС: ${formatMoney(totals.goodsVat)}`,
      `Итого к оплате: ${formatMoney(totals.grandTotal)}`
    );

    return lines.join("\n");
  };

  const buildOrderHtml = (data, totals, message) => {
    const itemsHtml = data.items
      .map((item) => {
        const lineNet = item.priceNet * item.qty;
        const lineVat = lineNet * item.vatRate;
        const lineGross = lineNet + lineVat;
        return `
          <li>
            <div>
              <strong>${escapeHtml(item.name)}</strong>
              <span class="order-item-sub">× ${item.qty} • Цена без НДС: ${escapeHtml(
          formatMoney(item.priceNet)
        )} • НДС: ${escapeHtml(formatMoney(lineVat))}</span>
            </div>
            <span class="order-item-price">${escapeHtml(formatMoney(lineGross))}</span>
          </li>
        `;
      })
      .join("");

    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/${managerPhone}?text=${encodedMessage}`;

    return `
      <div class="order-summary">
        <div class="order-summary-header">
          <h4>Заказ готов к отправке менеджеру</h4>
          <span class="order-pill">НДС ${Math.round(vatRate * 100)}%</span>
        </div>

        <div class="order-columns">
          <div class="order-block">
            <h5>Контакты</h5>
            <p><strong>Имя:</strong> ${escapeHtml(data.name)}</p>
            <p><strong>Телефон:</strong> ${escapeHtml(data.phone)}</p>
            <p><strong>Email:</strong> ${escapeHtml(data.email || "—")}</p>
          </div>
          <div class="order-block">
            <h5>Доставка и оплата</h5>
            <p><strong>Город:</strong> ${escapeHtml(data.city)}</p>
            <p><strong>Адрес:</strong> ${escapeHtml(data.address)}</p>
            <p><strong>Доставка:</strong> ${escapeHtml(data.deliveryMethod)}</p>
            <p><strong>Оплата:</strong> ${escapeHtml(data.paymentMethod)}</p>
            <p><strong>Комментарий:</strong> ${escapeHtml(data.comment || "—")}</p>
          </div>
        </div>

        <div class="order-block">
          <h5>Товары</h5>
          <ul class="order-items">${itemsHtml}</ul>
        </div>

        <div class="order-total">
          <div><span>Сумма без НДС</span><strong>${escapeHtml(
            formatMoney(totals.goodsNet)
          )}</strong></div>
          <div><span>НДС</span><strong>${escapeHtml(formatMoney(totals.goodsVat))}</strong></div>
          <div><span>Доставка</span><strong>${escapeHtml(
            formatMoney(totals.deliveryGross)
          )}</strong></div>
          <div class="order-total-final"><span>Итого к оплате</span><strong>${escapeHtml(
            formatMoney(totals.grandTotal)
          )}</strong></div>
        </div>

        <div class="order-actions">
          <a class="btn primary" href="${whatsappLink}" target="_blank" rel="noopener">Отправить менеджеру</a>
          <button type="button" class="btn" data-action="copy-order">Скопировать заказ</button>
          <a class="btn" href="tel:+77713226575">Позвонить менеджеру</a>
        </div>
        <div class="order-copy-status" aria-live="polite"></div>
        <p class="order-note">Контакт менеджера: ${escapeHtml(
          managerPhoneDisplay
        )}. Ссылка откроет WhatsApp и подставит текст заказа.</p>
      </div>
    `;
  };

  const renderCart = () => {
    if (!elements.cartBody) {
      return;
    }

    elements.cartBody.innerHTML = "";

    if (cart.size === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 7;
      cell.textContent = "Корзина пуста. Добавьте товары из каталога.";
      row.appendChild(cell);
      elements.cartBody.appendChild(row);
      updateTotals();
      return;
    }

    const template = document.getElementById("cartRowTemplate");
    if (!template) {
      return;
    }

    cart.forEach((item) => {
      const fragment = template.content.cloneNode(true);
      const row = fragment.querySelector(".cart-row");
      row.dataset.cartProductId = item.id;

      fragment.querySelector(".cart-name").textContent = item.name;
      fragment.querySelector(".cart-price-net").textContent = formatMoney(item.priceNet);
      fragment.querySelector(".qty-value").textContent = item.qty.toString();

      const sumNet = item.priceNet * item.qty;
      const sumVat = sumNet * item.vatRate;
      fragment.querySelector(".cart-sum-net").textContent = formatMoney(sumNet);
      fragment.querySelector(".cart-sum-vat").textContent = formatMoney(sumVat);
      fragment.querySelector(".cart-sum-gross").textContent = formatMoney(sumNet + sumVat);

      elements.cartBody.appendChild(fragment);
    });

    updateTotals();
  };

  const addToCart = (productId) => {
    const product = products.get(productId);
    if (!product) {
      return;
    }

    const existing = cart.get(productId);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.set(productId, { ...product, qty: 1 });
    }

    renderCart();
  };

  const updateCatalog = () => {
    const search = elements.searchInput ? elements.searchInput.value.trim().toLowerCase() : "";
    const category = elements.categorySelect ? elements.categorySelect.value : "all";
    let visibleCount = 0;

    cards.forEach((card) => {
      const nameEl = card.querySelector(".product-title");
      const descEl = card.querySelector(".product-desc");
      const name = nameEl ? nameEl.textContent.toLowerCase() : "";
      const desc = descEl ? descEl.textContent.toLowerCase() : "";
      const id = (card.dataset.productId || "").toLowerCase();
      const matchesSearch = !search || name.includes(search) || desc.includes(search) || id.includes(search);
      const matchesCategory = category === "all" || card.dataset.category === category;
      const visible = matchesSearch && matchesCategory;

      card.hidden = !visible;
      if (visible) {
        visibleCount += 1;
      }
    });

    if (elements.catalogEmpty) {
      elements.catalogEmpty.hidden = visibleCount !== 0;
    }
  };

  if (elements.productGrid) {
    elements.productGrid.addEventListener("click", (event) => {
      const button = event.target.closest('[data-action="add-to-cart"]');
      if (!button) {
        return;
      }

      const card = button.closest(".product-card");
      if (!card) {
        return;
      }

      addToCart(card.dataset.productId);
    });
  }

  if (elements.cartBody) {
    elements.cartBody.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-action]");
      if (!actionButton) {
        return;
      }

      const row = actionButton.closest(".cart-row");
      if (!row) {
        return;
      }

      const productId = row.dataset.cartProductId;
      const item = cart.get(productId);
      if (!item) {
        return;
      }

      if (actionButton.dataset.action === "qty-plus") {
        item.qty += 1;
      } else if (actionButton.dataset.action === "qty-minus") {
        item.qty = Math.max(1, item.qty - 1);
      } else if (actionButton.dataset.action === "remove") {
        cart.delete(productId);
      }

      renderCart();
    });
  }

  if (elements.searchInput) {
    elements.searchInput.addEventListener("input", updateCatalog);
  }

  if (elements.categorySelect) {
    elements.categorySelect.addEventListener("change", updateCatalog);
  }

  if (elements.deliveryPriceNet) {
    elements.deliveryPriceNet.addEventListener("input", updateTotals);
  }

  if (elements.deliveryMethod && elements.deliveryPriceNet) {
    elements.deliveryMethod.addEventListener("change", () => {
      if (elements.deliveryMethod.value === "pickup") {
        elements.deliveryPriceNet.value = "0";
      }
      updateTotals();
    });
  }

  const cartSection = document.getElementById("cart");
  if (elements.openCartBtn && cartSection) {
    elements.openCartBtn.addEventListener("click", () => {
      cartSection.scrollIntoView({ behavior: "smooth" });
    });
  }

  const checkoutSection = document.getElementById("checkout");
  if (elements.goCheckoutBtn && checkoutSection) {
    elements.goCheckoutBtn.addEventListener("click", () => {
      checkoutSection.scrollIntoView({ behavior: "smooth" });
    });
  }

  if (elements.checkoutForm) {
    elements.checkoutForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!elements.checkoutForm.reportValidity()) {
        return;
      }

      if (cart.size === 0) {
        if (elements.orderResult) {
          elements.orderResult.textContent = "Сначала добавьте товары в корзину.";
          elements.orderResult.hidden = false;
        }
        return;
      }

      updateTotals();

      const data = {
        name: getFieldValue("fullName") || "Клиент",
        phone: getFieldValue("phone") || "—",
        email: getFieldValue("email"),
        city: getFieldValue("city") || "—",
        address: getFieldValue("address") || "—",
        deliveryMethod:
          deliveryLabels[elements.deliveryMethod ? elements.deliveryMethod.value : ""] || "—",
        paymentMethod:
          paymentLabels[elements.paymentMethod ? elements.paymentMethod.value : ""] || "—",
        comment: getFieldValue("comment"),
        items: Array.from(cart.values())
      };

      const totals = calculateTotals();
      const message = buildOrderMessage(data, totals);

      if (elements.orderResult) {
        elements.orderResult.innerHTML = buildOrderHtml(data, totals, message);
        elements.orderResult.hidden = false;

        const copyButton = elements.orderResult.querySelector('[data-action="copy-order"]');
        const copyStatus = elements.orderResult.querySelector(".order-copy-status");
        if (copyButton && copyStatus) {
          copyButton.addEventListener("click", async () => {
            try {
              const success = await copyText(message);
              copyStatus.textContent = success
                ? "Текст заказа скопирован."
                : "Не удалось скопировать текст заказа.";
            } catch (error) {
              copyStatus.textContent = "Не удалось скопировать текст заказа.";
            }
          });
        }
      }
    });
  }

  updateCatalog();
  renderCart();
})();
